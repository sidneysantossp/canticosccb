/**
 * Script para criar usuário Admin no Firebase
 * Execute: node scripts/create-admin.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuração Firebase (mesma do .env)
const firebaseConfig = {
  apiKey: "AIzaSyA4kAO_LMNtD7UvJrYB9yCqdsiylkRI0sk",
  authDomain: "canticosccb-93133.firebaseapp.com",
  projectId: "canticosccb-93133",
  storageBucket: "canticosccb-93133.firebasestorage.app",
  messagingSenderId: "738151357983",
  appId: "1:738151357983:web:9c3cdbac35f6707469ff2a",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CONFIGURAÇÕES DO ADMIN (EDITE AQUI)
const ADMIN_EMAIL = 'admin@canticosccb.com.br';
const ADMIN_PASSWORD = 'Admin@2025';
const ADMIN_NAME = 'Administrador';

async function createAdmin() {
  try {
    console.log('🔄 Criando usuário admin...');
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );
    
    const user = userCredential.user;
    console.log('✅ Usuário criado:', user.uid);
    
    // Criar perfil no Firestore com permissão de admin
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      plan: 'premium',
      is_admin: true,
      is_composer: false,
      is_blocked: false,
      email_verified: true,
      created_at: new Date().toISOString(),
    });
    
    console.log('✅ Perfil admin criado no Firestore!');
    console.log('\n📋 CREDENCIAIS:');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Senha:', ADMIN_PASSWORD);
    console.log('\n🎉 Acesse: http://localhost:5175/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 Este email já está cadastrado.');
      console.log('Opções:');
      console.log('1. Use outro email no script');
      console.log('2. Ou vá no Firebase Console e promova usuário existente para admin');
    }
    
    process.exit(1);
  }
}

createAdmin();
