from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin:admin123@cluster0.ulh8nad.mongodb.net/?appName=Cluster0")

db = client["resumeDB"]
collection = db["candidates"]
