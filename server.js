const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const admin = require('firebase-admin');

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


const allowedOrigins = ['https://ingresso-frontend.onrender.com']; // <--- Confirme que esta URL está 100% correta!

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type'], 
  credentials: true 
};


app.use(cors(corsOptions));


app.options('/comprar-ingresso', cors(corsOptions)); 

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/comprar-ingresso', async (req, res) => { 
  console.log('Requisição POST recebida para /comprar-ingresso!');
  console.log('Dados recebidos:', req.body);

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
