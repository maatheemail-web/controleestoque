import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Use a local database file in data directory
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'inventory.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL performance mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_inventory_salt_2026').digest('hex');
}

export function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'OPERATOR',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Departments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      manager TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Materials Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      min_quantity REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'Geral',
      location TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Movements Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'IN' | 'OUT'
      material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
      date TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      supplier TEXT,
      invoice_number TEXT,
      department_id INTEGER REFERENCES departments(id) ON DELETE RESTRICT,
      reason TEXT,
      requested_by TEXT,
      stock_before REAL NOT NULL,
      stock_after REAL NOT NULL,
      user_name TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Requisitions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS requisitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_number TEXT UNIQUE NOT NULL,
      department_id INTEGER NOT NULL REFERENCES departments(id),
      requested_by TEXT NOT NULL,
      authorized_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      reason TEXT NOT NULL,
      date TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total_value REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if seeding is needed
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    seedDatabase();
  }
}

export function seedDatabase() {
  console.log('Seeding relational inventory database with initial production data...');

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, name, role)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run('admin', hashPassword('admin123'), 'Matheus Silva', 'ADMIN');
  insertUser.run('operador', hashPassword('estoque123'), 'Carlos Almoxarife', 'OPERATOR');

  // 2. Seed Departments
  const insertDept = db.prepare(`
    INSERT INTO departments (code, name, manager, active)
    VALUES (?, ?, ?, ?)
  `);

  const depts = [
    { code: 'MANUT', name: 'Manutenção Industrial & Predial', manager: 'Roberto Santos' },
    { code: 'PROD', name: 'Linha de Produção & Usinagem', manager: 'Juliana Mendes' },
    { code: 'TI', name: 'Tecnologia da Informação & Infra', manager: 'Lucas Ferreira' },
    { code: 'ALMOX', name: 'Almoxarifado Central & Expedição', manager: 'Matheus Silva' },
    { code: 'SEG', name: 'Segurança do Trabalho (SESMT)', manager: 'Dra. Vanessa Lima' },
    { code: 'LOG', name: 'Logística & Frotas', manager: 'Alexandre Costa' },
  ];

  for (const d of depts) {
    insertDept.run(d.code, d.name, d.manager, 1);
  }

  // 3. Seed Materials
  const insertMaterial = db.prepare(`
    INSERT INTO materials (code, name, unit, min_quantity, unit_price, current_stock, category, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const materialsList = [
    { code: 'MAT-001', name: 'Rolamento Rígido de Esferas 6204-2RSH', unit: 'UN', min_quantity: 25, unit_price: 38.50, current_stock: 42, category: 'Mecânica', location: 'Corredor A - Prateleira 03' },
    { code: 'MAT-002', name: 'Óleo Lubrificante Industrial ISO VG 68 (Balde 20L)', unit: 'BD', min_quantity: 10, unit_price: 245.00, current_stock: 8, category: 'Lubrificantes', location: 'Corredor D - Palete 01' }, // BELOW MIN
    { code: 'MAT-003', name: 'Luva de Proteção Nitrílica Cano Longo Tam G', unit: 'PAR', min_quantity: 60, unit_price: 14.20, current_stock: 120, category: 'EPI', location: 'Corredor B - Prateleira 01' },
    { code: 'MAT-004', name: 'Cabo Flexível de Cobre 2,5mm² 750V Preto (Rolo 100m)', unit: 'RL', min_quantity: 12, unit_price: 189.90, current_stock: 5, category: 'Elétrica', location: 'Corredor C - Prateleira 04' }, // BELOW MIN
    { code: 'MAT-005', name: 'Óculos de Segurança Antirrisco Incolor CA', unit: 'UN', min_quantity: 40, unit_price: 8.90, current_stock: 65, category: 'EPI', location: 'Corredor B - Prateleira 02' },
    { code: 'MAT-006', name: 'Disjuntor Bipolar Termomagnético Din 32A 3kA', unit: 'PC', min_quantity: 15, unit_price: 34.00, current_stock: 0, category: 'Elétrica', location: 'Corredor C - Prateleira 02' }, // ZERO STOCK / OUT
    { code: 'MAT-007', name: 'Parafuso Sextavado Aço 8.8 M10x40 Zincado', unit: 'CT', min_quantity: 30, unit_price: 52.00, current_stock: 58, category: 'Fixação', location: 'Corredor A - Gaveteiro 12' },
    { code: 'MAT-008', name: 'Fita Isolante de Alta Tensão 19mm x 20m 3M', unit: 'UN', min_quantity: 50, unit_price: 11.50, current_stock: 84, category: 'Elétrica', location: 'Corredor C - Prateleira 01' },
    { code: 'MAT-009', name: 'Válvula Esfera Bipartida Inox 316 1 Pol.', unit: 'PC', min_quantity: 8, unit_price: 310.00, current_stock: 14, category: 'Hidráulica', location: 'Corredor D - Prateleira 05' },
    { code: 'MAT-010', name: 'Respirador PFF2 / N95 com Válvula de Exalação', unit: 'UN', min_quantity: 80, unit_price: 4.80, current_stock: 35, category: 'EPI', location: 'Corredor B - Prateleira 03' }, // BELOW MIN
    { code: 'MAT-011', name: 'Graxa de Lítio Multiuso EP-2 (Pote 1kg)', unit: 'UN', min_quantity: 20, unit_price: 46.00, current_stock: 22, category: 'Lubrificantes', location: 'Corredor D - Prateleira 02' },
    { code: 'MAT-012', name: 'Lâmpada Tubular LED T8 18W Bivolt 6500K', unit: 'UN', min_quantity: 35, unit_price: 16.50, current_stock: 50, category: 'Iluminação', location: 'Corredor E - Prateleira 01' },
  ];

  for (const m of materialsList) {
    insertMaterial.run(m.code, m.name, m.unit, m.min_quantity, m.unit_price, m.current_stock, m.category, m.location);
  }

  // 4. Seed Historical Movements (Entries and Exits with balance traceability)
  const insertMovement = db.prepare(`
    INSERT INTO movements (
      type, material_id, date, quantity, unit_price, total_price,
      supplier, invoice_number, department_id, reason, requested_by,
      stock_before, stock_after, user_name, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialMovements = [
    // Entrada inicial Rolamentos
    { type: 'IN', material_id: 1, date: '2026-08-15 09:30', qty: 60, price: 38.50, sup: 'Distribuidora SKF Brasil Ltda', nf: 'NF-84920', dept: null, reason: null, req: null, before: 0, after: 60, user: 'Matheus Silva', notes: 'Compra programada reposição de estoque' },
    // Saída para Manutenção
    { type: 'OUT', material_id: 1, date: '2026-08-28 14:15', qty: 10, price: 38.50, sup: null, nf: null, dept: 1, reason: 'Troca preventiva rolamentos redutor esteira 02', req: 'Carlos Mecânico', before: 60, after: 50, user: 'Carlos Almoxarife', notes: 'OS-4091' },
    // Saída para Produção
    { type: 'OUT', material_id: 1, date: '2026-09-04 11:20', qty: 8, price: 38.50, sup: null, nf: null, dept: 2, reason: 'Manutenção periódica torno CNC 04', req: 'Juliana Mendes', before: 50, after: 42, user: 'Matheus Silva', notes: 'OS-4188' },
    
    // Entrada Óleo Industrial
    { type: 'IN', material_id: 2, date: '2026-08-10 10:00', qty: 15, price: 245.00, sup: 'Petrobrás Distribuidora Lubrificantes', nf: 'NF-77312', dept: null, reason: null, req: null, before: 0, after: 15, user: 'Matheus Silva', notes: 'Lote de lubrificantes Q3' },
    // Saídas Óleo Industrial
    { type: 'OUT', material_id: 2, date: '2026-08-20 16:40', qty: 4, price: 245.00, sup: null, nf: null, dept: 1, reason: 'Reabastecimento sistema hidráulico prensa central', req: 'Roberto Santos', before: 15, after: 11, user: 'Carlos Almoxarife', notes: 'OS-3980' },
    { type: 'OUT', material_id: 2, date: '2026-09-02 08:30', qty: 3, price: 245.00, sup: null, nf: null, dept: 2, reason: 'Troca de fluido de corte e lubrificação usinagem', req: 'Antônio Operador', before: 11, after: 8, user: 'Matheus Silva', notes: 'OS-4120' },

    // Entrada Luva de Proteção
    { type: 'IN', material_id: 3, date: '2026-08-01 08:00', qty: 150, price: 14.20, sup: 'Volk do Brasil Equipamentos de Segurança', nf: 'NF-66109', dept: null, reason: null, req: null, before: 0, after: 150, user: 'Matheus Silva', notes: 'Pedido anual SESMT' },
    // Saída Luvas
    { type: 'OUT', material_id: 3, date: '2026-08-25 10:15', qty: 30, price: 14.20, sup: null, nf: null, dept: 5, reason: 'Distribuição quinzenal de EPI setor operacional', req: 'Dra. Vanessa Lima', before: 150, after: 120, user: 'Carlos Almoxarife', notes: 'Requisição SESMT-89' },

    // Entrada Cabos elétricos
    { type: 'IN', material_id: 4, date: '2026-08-18 13:45', qty: 15, price: 189.90, sup: 'Prysmian Cabos e Sistemas Elétricos', nf: 'NF-90214', dept: null, reason: null, req: null, before: 0, after: 15, user: 'Matheus Silva', notes: 'Reforma do galpão B' },
    // Saída Cabos elétricos
    { type: 'OUT', material_id: 4, date: '2026-09-05 15:00', qty: 10, price: 189.90, sup: null, nf: null, dept: 1, reason: 'Infraestrutura elétrica novos quadros de força', req: 'Marcos Eletricista', before: 15, after: 5, user: 'Carlos Almoxarife', notes: 'OS-4210' },

    // Saída Disjuntores (ficou zerado)
    { type: 'IN', material_id: 6, date: '2026-07-20 11:00', qty: 20, price: 34.00, sup: 'Schneider Electric Brasil', nf: 'NF-54120', dept: null, reason: null, req: null, before: 0, after: 20, user: 'Matheus Silva', notes: 'Estoque inicial' },
    { type: 'OUT', material_id: 6, date: '2026-09-07 09:10', qty: 20, price: 34.00, sup: null, nf: null, dept: 1, reason: 'Adequação NR-10 subestação auxiliar', req: 'Roberto Santos', before: 20, after: 0, user: 'Matheus Silva', notes: 'OS-4300 - Reposição urgente necessária!' },
  ];

  for (const mov of initialMovements) {
    insertMovement.run(
      mov.type,
      mov.material_id,
      mov.date,
      mov.qty,
      mov.price,
      mov.qty * mov.price,
      mov.sup,
      mov.nf,
      mov.dept,
      mov.reason,
      mov.req,
      mov.before,
      mov.after,
      mov.user,
      mov.notes
    );
  }

  // 5. Seed Initial Requisitions
  const insertReq = db.prepare(`
    INSERT INTO requisitions (
      req_number, department_id, requested_by, authorized_by,
      status, reason, date, items_json, total_value, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const req1Items = [
    { material_id: 1, material_code: 'MAT-001', material_name: 'Rolamento Rígido de Esferas 6204-2RSH', unit: 'UN', quantity: 10, unit_price: 38.50, total_price: 385.00 },
    { material_id: 2, material_code: 'MAT-002', material_name: 'Óleo Lubrificante Industrial ISO VG 68 (Balde 20L)', unit: 'BD', quantity: 4, unit_price: 245.00, total_price: 980.00 },
  ];

  insertReq.run(
    'REQ-2026-0001',
    1, // MANUT
    'Roberto Santos',
    'Eng. Geraldo Pires',
    'COMPLETED',
    'Manutenção corretiva e preventiva linha pesada',
    '2026-08-28',
    JSON.stringify(req1Items),
    1365.00,
    'Atendido em balcão pelo Almoxarife Carlos'
  );

  const req2Items = [
    { material_id: 3, material_code: 'MAT-003', material_name: 'Luva de Proteção Nitrílica Cano Longo Tam G', unit: 'PAR', quantity: 30, unit_price: 14.20, total_price: 426.00 },
  ];

  insertReq.run(
    'REQ-2026-0002',
    5, // SEG
    'Dra. Vanessa Lima',
    'Matheus Silva',
    'COMPLETED',
    'Entrega quinzenal de EPIs para brigada e usinagem',
    '2026-08-25',
    JSON.stringify(req2Items),
    426.00,
    'Conforme protocolo SESMT e fichas individuais'
  );

  console.log('Database seeded successfully.');
}
