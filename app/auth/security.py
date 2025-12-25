from passlib.context import CryptContext
from jose import jwt
from datetime import datetime,timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose.exceptions import ExpiredSignatureError, JWTError

from app.core.config import JWTSettings
from app.core.database import get_db
from app.auth.models import User

from dotenv import load_dotenv
load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

jwt_settings = JWTSettings()

pwd_context = CryptContext(schemes = ["bcrypt"],deprecated="auto")
secret_key = jwt_settings.SECRET_KEY
algo = jwt_settings.ALGORITHM
access_token_expire_minutes = jwt_settings.ACCESS_TOKEN_EXPIRE_MINUTES

def hash_password(pwd:str) -> str:
    return pwd_context.hash(pwd)

def verify_password(plain_pwd:str, hashed_pwd:str) -> bool:
    return pwd_context.verify(plain_pwd, hashed_pwd)

def create_token(user_id:int) -> str:
    payload = {
        "sub" : str(user_id),
        "exp" : datetime.now() + timedelta(minutes=access_token_expire_minutes)
    }

    return jwt.encode(payload, secret_key, algorithm=algo)

def decode_token(token:str) -> dict:
    return jwt.decode(token, secret_key, algorithms=[algo])

def get_current_user(token:str = Depends(oauth2_scheme), db:Session = Depends(get_db)) -> User:
    try:
        payload = decode_token(token)
        user_id:int = int(payload.get("sub"))
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate":"Bearer"}
            )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate":"Bearer"}
        )
    return user