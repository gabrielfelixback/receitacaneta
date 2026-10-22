// Testes da validação do quiz. Rodar: npm run test:backend
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ipDoCliente, validarRegistro } from '../supabase/functions/_shared/validar.ts';

const sessao = '3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b';

test('aceita um registro completo e limpa UTMs', () => {
  const r = validarRegistro({
    sessao, tipo: 'concluido', etapa: 12, perfil: 'gelado', versao: 'v1',
    respostas: { idade: 'i45', sintomas: ['doce', 'gelado', 'doce'], peso: 82.4 },
    utm: { utm_source: 'fb', utm_campaign: 'teste', email: 'x@y.com' },
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.dados.respostas, { idade: 'i45', sintomas: ['doce', 'gelado'], peso: 82 });
  assert.deepEqual(r.dados.utm, { utm_source: 'fb', utm_campaign: 'teste' });
});

test('recusa sessão, tipo e perfil inválidos', () => {
  assert.equal(validarRegistro({ sessao: 'abc', tipo: 'inicio' }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'compra' }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'concluido', perfil: 'xyz' }).ok, false);
  assert.equal(validarRegistro(null).ok, false);
});

test('etapa é obrigatória no tipo etapa e fica entre 0 e 40', () => {
  assert.equal(validarRegistro({ sessao, tipo: 'etapa' }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 41 }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1.5 }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 3 }).ok, true);
});

test('não aceita texto livre nas respostas', () => {
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { nome: 'Maria Silva' } }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { 'x-y': 'a' } }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { a: { b: 'c' } } }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { idade: 45 } }).ok, false);
});

test('altura só entre 120 e 230 cm', () => {
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { altura: 100 } }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { altura: 231 } }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { peso: 82, altura: 165 } }).ok, true);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { idade: 165 } }).ok, false);
});

test('peso só entre 30 e 300 kg', () => {
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { peso: 10 } }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { peso: 301 } }).ok, false);
  assert.equal(validarRegistro({ sessao, tipo: 'etapa', etapa: 1, respostas: { peso: 70 } }).ok, true);
});

test('pega o primeiro IP do x-forwarded-for', () => {
  assert.equal(ipDoCliente('200.1.2.3, 10.0.0.1', null), '200.1.2.3');
  assert.equal(ipDoCliente(null, '200.9.9.9'), '200.9.9.9');
  assert.equal(ipDoCliente(null, null), null);
});
