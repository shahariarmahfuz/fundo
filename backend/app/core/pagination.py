from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(None, description="Search keyword")
    sort_by: Optional[str] = Field(None, description="Sort column")
    sort_order: Optional[str] = Field("desc", description="Sort order: asc or desc")
