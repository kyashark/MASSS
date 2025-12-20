from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from . import models, schemas

router = APIRouter(
    tags=["Test CRUD"]
)

# --- CREATE ---
@router.post("/", response_model=schemas.TestItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item: schemas.TestItemCreate, db: Session = Depends(get_db)):
    new_item = models.TestItem(title=item.title, description=item.description)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

# --- READ ALL ---
@router.get("/", response_model=List[schemas.TestItemResponse])
def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(models.TestItem).offset(skip).limit(limit).all()
    return items

# --- READ ONE ---
@router.get("/{item_id}", response_model=schemas.TestItemResponse)
def read_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.TestItem).filter(models.TestItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# --- UPDATE ---
@router.put("/{item_id}", response_model=schemas.TestItemResponse)
def update_item(item_id: int, item_update: schemas.TestItemUpdate, db: Session = Depends(get_db)):
    # 1. Find the item
    db_item = db.query(models.TestItem).filter(models.TestItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # 2. Update fields if provided
    if item_update.title is not None:
        db_item.title = item_update.title
    if item_update.description is not None:
        db_item.description = item_update.description
    
    # 3. Commit
    db.commit()
    db.refresh(db_item)
    return db_item

# --- DELETE ---
@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.TestItem).filter(models.TestItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return None