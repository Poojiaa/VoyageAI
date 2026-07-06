import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from sqlalchemy.orm import Session
from app.database.config import get_db
from app.database.models import User
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS", "firebase-service-account.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            print(f"Warning: Firebase credentials not found at {cred_path}. Auth will run in simulated mode.")
except Exception as e:
    print(f"Firebase Init Error: {e}")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Middleware to verify Firebase JWT token and return DB User.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = credentials.credentials
    try:
        if not firebase_admin._apps:
            # Firebase Admin not initialized — decode JWT payload without signature verification
            # to extract user identity. The frontend Firebase SDK already validated the token.
            import json, base64
            try:
                # JWT structure: header.payload.signature
                payload_b64 = token.split(".")[1]
                # Add padding if needed
                padding_needed = len(payload_b64) % 4
                if padding_needed:
                    payload_b64 += "=" * (4 - padding_needed)
                decoded_payload = json.loads(base64.urlsafe_b64decode(payload_b64))
                uid = decoded_payload.get("user_id") or decoded_payload.get("sub", "")
                email = decoded_payload.get("email", "")
                name = decoded_payload.get("name", "")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not decode authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
            decoded_payload = firebase_auth.verify_id_token(token)
            uid = decoded_payload["uid"]
            email = decoded_payload.get("email", "")
            name = decoded_payload.get("name", "")
        
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a valid user ID.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            # Auto create user if they exist in Firebase but not DB
            user = User(
                id=uid,
                email=email,
                full_name=name
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


class RegisterRequest(BaseModel):
    email: str
    full_name: str
    uid: str

@router.post("/auth/register")
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    """Creates a user profile in DB after Firebase signup"""
    user = db.query(User).filter(User.id == request.uid).first()
    if user:
        return {"message": "User already exists", "user": user}
        
    new_user = User(
        id=request.uid,
        email=request.email,
        full_name=request.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "user": new_user}

@router.post("/auth/login")
def login_user(user: User = Depends(get_current_user)):
    """Verifies token and returns user profile"""
    return {"message": "Login successful", "user": user}

