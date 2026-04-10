from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)


class ReplicaOut(CamelModel):
    role: str
    text: str
    timestamp: int


class CallOut(CamelModel):
    id: str
    filename: str
    date: str
    duration: int
    topics: list[str]
    status: str
    operator: str | None = None


class CallDetailOut(CallOut):
    summary: str | None = None
    replica_count: int
    replicas: list[ReplicaOut]
    audio_url: str | None = None


class CallsListResponse(CamelModel):
    items: list[CallOut]
    total: int
