from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: str
    name: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut
