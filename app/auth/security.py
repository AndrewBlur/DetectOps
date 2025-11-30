from passlib.context import CryptContext
from jose import jwt
from datetime import datetime,timedelta
from dotenv import load_dotenv
load_dotenv()
import os

pwd_context = CryptContext(schemes = ["bcrypt"],deprecated="auto")
secret_key = os.getenv("SECRET_KEY")
algo = "HS256"

def hash_password(pwd:str) -> str:
    return pwd_context.hash(pwd)

def verify_password(plain_pwd:str, hashed_pwd:str) -> bool:
    return pwd_context.verify(plain_pwd, hashed_pwd)

def create_token(user_id:int) -> str:
    payload = {
        "sub" : str(user_id),
        "exp" : datetime.now() + timedelta(minutes=30)
    }

    return jwt.encode(payload, secret_key, algorithm=algo)

def decode_token(token:str) -> dict:
    return jwt.decode(token, secret_key, algorithms=[algo])