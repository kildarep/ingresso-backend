const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Importa o Firebase Admin SDK
const admin = require('firebase-admin');


// Por exemplo, no Render:
// Key: FIREBASE_SERVICE_ACCOUNT
// Value: { "type": "service_account", "project_id": "...", "private_key_id": "...", ... } (todo o JSON aqui)

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Erro: A variável de ambiente FIREBASE_SERVICE_ACCOUNT não está definida.');
  console.error('Certifique-se de configurar esta variável no Render com o conteúdo do seu arquivo de chave de conta de serviço do Firebase.');
  
  process.exit(1); 
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors()); 

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/comprar-ingresso', async (req, res) => { 
  const { nome, celular } = req.body;
  
  try {
    
    const docRef = await db.collection('compras').add({
      nome: nome,
      celular: celular,
      dataRegistro: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    console.log('Novo pagamento recebido e salvo no Firestore com ID:', docRef.id);
    res.send('Dados recebidos com sucesso!');

  } catch (err) {
    console.error('Erro ao salvar no Firestore:', err);
    return res.status(500).send('Erro ao salvar os dados.');
  }
});

app.get('/lista-pagamentos2311', async (req, res) => { 
    try {
        const comprasSnapshot = await db.collection('compras').orderBy('dataRegistro', 'desc').get();
        let data = '';
        if (comprasSnapshot.empty) {
            return res.status(200).send('Nenhum pagamento registrado ainda.');
        }

        comprasSnapshot.forEach(doc => {
            const compra = doc.data();
            const dataFormatada = compra.dataRegistro ? new Date(compra.dataRegistro._seconds * 1000).toLocaleString('pt-BR') : 'N/A';
            data += `Nome: ${compra.nome}, Celular: ${compra.celular}, Data: ${dataFormatada}\n`;
        });
        res.type('text/plain').send(data);
    } catch (err) {
        console.error('Erro ao ler do Firestore:', err);
        return res.status(500).send('Erro ao ler os pagamentos.');
    }
});
  
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
