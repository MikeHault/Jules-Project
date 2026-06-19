from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///data/photos.db"

Base = declarative_base()

class DownloadedPhoto(Base):
    __tablename__ = "downloaded_photos"
    id = Column(String, primary_key=True)
    filename = Column(String)
    downloaded_at = Column(DateTime, default=datetime.now)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
