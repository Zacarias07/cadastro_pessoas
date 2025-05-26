import os
from flask import Flask, jsonify, request, send_from_directory
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MONGO_URI = "mongodb+srv://zacarias:1802@animais.zi7nvrw.mongodb.net/Animais?retryWrites=true&w=majority&appName=Animais"
client = MongoClient(MONGO_URI)
db = client['Animais']
pessoas_collection = db.pessoas

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def serialize_pessoa(pessoa):
    return {
        "id": str(pessoa["_id"]),
        "nome": pessoa.get("nome"),
        "email": pessoa.get("email"),
        "telefone": pessoa.get("telefone"),
        "cpf": pessoa.get("cpf", ""),
        "imagem": pessoa.get("imagem", ""),
        # Campos novos:
        "rua": pessoa.get("rua", ""),
        "numero": pessoa.get("numero", ""),
        "bairro": pessoa.get("bairro", ""),
        "cidade": pessoa.get("cidade", ""),
        "estado": pessoa.get("estado", ""),
        "cep": pessoa.get("cep", ""),
    }

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/pessoas', methods=['GET'])
def listar_pessoas():
    pessoas = list(pessoas_collection.find())
    return jsonify([serialize_pessoa(p) for p in pessoas])

@app.route('/api/pessoas/<id>', methods=['GET'])
def buscar_pessoa(id):
    try:
        pessoa = pessoas_collection.find_one({"_id": ObjectId(id)})
        if pessoa:
            return jsonify(serialize_pessoa(pessoa))
        return jsonify({"error": "Pessoa não encontrada"}), 404
    except:
        return jsonify({"error": "ID inválido"}), 400

@app.route('/api/pessoas', methods=['POST'])
def criar_pessoa():
    data = request.form
    pessoa = {
        "nome": data.get("nome"),
        "email": data.get("email"),
        "telefone": data.get("telefone"),
        "cpf": data.get("cpf"),
        "rua": data.get("rua"),
        "numero": data.get("numero"),
        "bairro": data.get("bairro"),
        "cidade": data.get("cidade"),
        "estado": data.get("estado"),
        "cep": data.get("cep"),
        "imagem": ""
    }

    if 'imagem' in request.files:
        file = request.files['imagem']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            import time
            filename = f"{int(time.time())}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            pessoa['imagem'] = filename

    resultado = pessoas_collection.insert_one(pessoa)
    pessoa["_id"] = resultado.inserted_id
    return jsonify(serialize_pessoa(pessoa)), 201

@app.route('/api/pessoas/<id>', methods=['PUT'])
def atualizar_pessoa(id):
    data = request.form
    update_data = {
        "nome": data.get("nome"),
        "email": data.get("email"),
        "telefone": data.get("telefone"),
        "cpf": data.get("cpf"),
        "rua": data.get("rua"),
        "numero": data.get("numero"),
        "bairro": data.get("bairro"),
        "cidade": data.get("cidade"),
        "estado": data.get("estado"),
        "cep": data.get("cep"),
    }

    if 'imagem' in request.files:
        file = request.files['imagem']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            import time
            filename = f"{int(time.time())}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            update_data['imagem'] = filename

    pessoas_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )

    pessoa = pessoas_collection.find_one({"_id": ObjectId(id)})
    return jsonify(serialize_pessoa(pessoa))

@app.route('/api/pessoas/<id>', methods=['DELETE'])
def deletar_pessoa(id):
    pessoas_collection.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Pessoa deletada com sucesso"}), 200

if __name__ == '__main__':
    app.run(debug=True)
