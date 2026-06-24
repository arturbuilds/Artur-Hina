from fastapi import FastAPI, Request, Depends
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

database_url = 'sqlite:///./tactical.db'
engine = create_engine(database_url, connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Word(Base):
    __tablename__ = 'words'

    id = Column(Integer, primary_key=True, index=True)
    japanese = Column(String)
    reading = Column(String)
    translation = Column(String)
    status = Column(String, default='Learning')
    is_favorite = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

app = FastAPI()

templates = Jinja2Templates(directory="template")
app.mount("/static", StaticFiles(directory="static"), name="static")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get('/words')
def get_words(page: int = 1, limit: int = 5, search: str = "", status: str = "", db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    
    query = db.query(Word)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Word.japanese.like(search_filter)) | 
            (Word.reading.like(search_filter)) | 
            (Word.translation.like(search_filter))
        )
        
    if status:
        query = query.filter(Word.status == status)
        
    total = query.count()
    
    words = query.offset(offset).limit(limit).all()
    
    return {
        "words": words,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1
    }


@app.post('/add')
def add_word(japanese: str, reading: str, translation: str, db: Session = Depends(get_db)):
    new_word = Word(japanese=japanese, reading=reading, translation=translation)
    db.add(new_word)
    db.commit()
    return {'message': 'Word saved! Hina-sensei would be proud.'}

@app.put('/words/{word_id}/status')
def update_status(word_id: int, status: str, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()
    if word:
        word.status = status
        db.commit()
    return {'message': f'Статус изменен на {status}'}

@app.put('/words/{word_id}/favorite')
def toggle_favorite_db(word_id: int, is_favorite: bool, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()
    if word:
        word.is_favorite = is_favorite
        db.commit()
    return {'message': 'Статус избранного обновлен'}

@app.delete('/words/{word_id}')
def delete_word(word_id: int, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()
    if word:
        db.delete(word)
        db.commit()
    return {'message': 'Слово удалено'}
