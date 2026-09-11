import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, hashPassword, seedDatabase } from './src/server/db.ts';

// Initialize the database tables and initial seed data
initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const hashed = hashPassword(password);
  const user = db.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password_hash = ?').get(username, hashed) as any;

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o usuário e a senha.' });
  }

  // Simple token simulation for demo/local storage
  const token = `token_${user.id}_${Date.now()}`;
  res.json({
    user,
    token,
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const token = authHeader.replace('Bearer ', '');
  const parts = token.split('_');
  const userId = parts[1];

  if (!userId) {
    return res.status(401).json({ error: 'Sessão inválida' });
  }

  const user = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }

  res.json({ user });
});

// ==========================================
// 2. MATERIALS ENDPOINTS
// ==========================================

app.get('/api/materials', (req, res) => {
  try {
    const materials = db.prepare(`
      SELECT 
        id, code, name, unit, min_quantity, unit_price, current_stock, category, location, created_at, updated_at,
        (current_stock * unit_price) AS total_value,
        CASE
          WHEN current_stock <= 0 THEN 'OUT_OF_STOCK'
          WHEN current_stock <= min_quantity THEN 'LOW'
          ELSE 'NORMAL'
        END AS status
      FROM materials
      ORDER BY name ASC
    `).all();

    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar materiais: ' + error.message });
  }
});

app.post('/api/materials', (req, res) => {
  try {
    const { code, name, unit, min_quantity, unit_price, current_stock, category, location } = req.body;

    if (!code || !name || !unit) {
      return res.status(400).json({ error: 'Código, nome e unidade de medida são obrigatórios.' });
    }

    const minQtyNum = Number(min_quantity) || 0;
    const priceNum = Number(unit_price) || 0;
    const stockNum = Number(current_stock) || 0;

    if (minQtyNum < 0 || priceNum < 0 || stockNum < 0) {
      return res.status(400).json({ error: 'Valores de quantidade e preço não podem ser negativos.' });
    }

    // Check duplicate code
    const existing = db.prepare('SELECT id FROM materials WHERE code = ?').get(code.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ error: `Já existe um material cadastrado com o código ${code}.` });
    }

    const result = db.prepare(`
      INSERT INTO materials (code, name, unit, min_quantity, unit_price, current_stock, category, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.trim().toUpperCase(),
      name.trim(),
      unit.trim().toUpperCase(),
      minQtyNum,
      priceNum,
      stockNum,
      category ? category.trim() : 'Geral',
      location ? location.trim() : ''
    );

    // If initial stock > 0, record initial entry movement
    if (stockNum > 0) {
      db.prepare(`
        INSERT INTO movements (
          type, material_id, date, quantity, unit_price, total_price,
          supplier, invoice_number, stock_before, stock_after, user_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'IN',
        result.lastInsertRowid,
        new Date().toISOString().replace('T', ' ').substring(0, 16),
        stockNum,
        priceNum,
        stockNum * priceNum,
        'Inventário Inicial / Implantação',
        'SALDO-INICIAL',
        0,
        stockNum,
        'Sistema',
        'Saldo de implantação cadastral'
      );
    }

    const created = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar material: ' + error.message });
  }
});

app.put('/api/materials/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { code, name, unit, min_quantity, unit_price, category, location } = req.body;

    if (!code || !name || !unit) {
      return res.status(400).json({ error: 'Código, nome e unidade de medida são obrigatórios.' });
    }

    // Check duplicate code excluding current id
    const existing = db.prepare('SELECT id FROM materials WHERE code = ? AND id != ?').get(code.trim().toUpperCase(), id);
    if (existing) {
      return res.status(400).json({ error: `O código ${code} já está em uso por outro material.` });
    }

    db.prepare(`
      UPDATE materials
      SET code = ?, name = ?, unit = ?, min_quantity = ?, unit_price = ?, category = ?, location = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      code.trim().toUpperCase(),
      name.trim(),
      unit.trim().toUpperCase(),
      Number(min_quantity) || 0,
      Number(unit_price) || 0,
      category ? category.trim() : 'Geral',
      location ? location.trim() : '',
      id
    );

    const updated = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar material: ' + error.message });
  }
});

app.delete('/api/materials/:id', (req, res) => {
  try {
    const id = Number(req.params.id);

    // Check if there are movements
    const movCount = (db.prepare('SELECT COUNT(*) as count FROM movements WHERE material_id = ?').get(id) as any).count;
    if (movCount > 0) {
      return res.status(400).json({
        error: `Não é possível excluir este material pois ele possui ${movCount} movimentação(ões) registrada(s). Para manter a rastreabilidade fiscal e operacional, o histórico deve ser preservado.`
      });
    }

    db.prepare('DELETE FROM materials WHERE id = ?').run(id);
    res.json({ success: true, message: 'Material excluído com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir material: ' + error.message });
  }
});

// ==========================================
// 3. DEPARTMENTS ENDPOINTS
// ==========================================

app.get('/api/departments', (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT 
        d.id, d.code, d.name, d.manager, d.active, d.created_at,
        COUNT(m.id) AS movements_count
      FROM departments d
      LEFT JOIN movements m ON m.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();

    res.json(departments);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar setores: ' + error.message });
  }
});

app.post('/api/departments', (req, res) => {
  try {
    const { code, name, manager } = req.body;
    if (!code || !name || !manager) {
      return res.status(400).json({ error: 'Código/Sigla, nome do setor e responsável são obrigatórios.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM departments WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ error: `Já existe um setor com a sigla ${cleanCode}.` });
    }

    const result = db.prepare(`
      INSERT INTO departments (code, name, manager, active)
      VALUES (?, ?, ?, 1)
    `).run(cleanCode, name.trim(), manager.trim());

    const created = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar setor: ' + error.message });
  }
});

app.put('/api/departments/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { code, name, manager, active } = req.body;

    if (!code || !name || !manager) {
      return res.status(400).json({ error: 'Código/Sigla, nome e responsável são obrigatórios.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM departments WHERE code = ? AND id != ?').get(cleanCode, id);
    if (existing) {
      return res.status(400).json({ error: `A sigla ${cleanCode} já pertence a outro setor.` });
    }

    db.prepare(`
      UPDATE departments
      SET code = ?, name = ?, manager = ?, active = ?
      WHERE id = ?
    `).run(cleanCode, name.trim(), manager.trim(), active !== undefined ? (active ? 1 : 0) : 1, id);

    const updated = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar setor: ' + error.message });
  }
});

app.delete('/api/departments/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const movCount = (db.prepare('SELECT COUNT(*) as count FROM movements WHERE department_id = ?').get(id) as any).count;
    if (movCount > 0) {
      return res.status(400).json({
        error: `Não é possível excluir o setor pois ele possui ${movCount} saída(s) vinculada(s). Você pode desativá-lo para impedir novas requisições.`
      });
    }

    db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    res.json({ success: true, message: 'Setor excluído com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir setor: ' + error.message });
  }
});

// ==========================================
// 4. MOVEMENTS ENDPOINTS
// ==========================================

app.get('/api/movements', (req, res) => {
  try {
    const { type, material_id, department_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        m.id, m.type, m.material_id, m.date, m.quantity, m.unit_price, m.total_price,
        m.supplier, m.invoice_number, m.department_id, m.reason, m.requested_by,
        m.stock_before, m.stock_after, m.user_name, m.notes, m.created_at,
        mat.code AS material_code, mat.name AS material_name, mat.unit AS material_unit,
        d.code AS department_code, d.name AS department_name
      FROM movements m
      JOIN materials mat ON mat.id = m.material_id
      LEFT JOIN departments d ON d.id = m.department_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (type && (type === 'IN' || type === 'OUT')) {
      query += ' AND m.type = ?';
      params.push(type);
    }
    if (material_id) {
      query += ' AND m.material_id = ?';
      params.push(Number(material_id));
    }
    if (department_id) {
      query += ' AND m.department_id = ?';
      params.push(Number(department_id));
    }
    if (start_date) {
      query += ' AND m.date >= ?';
      params.push(String(start_date));
    }
    if (end_date) {
      query += ' AND m.date <= ?';
      params.push(String(end_date) + ' 23:59:59');
    }

    query += ' ORDER BY m.date DESC, m.id DESC';

    const movements = db.prepare(query).all(...params);
    res.json(movements);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar movimentações: ' + error.message });
  }
});

// Registro de ENTRADA de material
app.post('/api/movements/in', (req, res) => {
  try {
    const { material_id, date, quantity, unit_price, supplier, invoice_number, user_name, notes } = req.body;

    if (!material_id || !quantity) {
      return res.status(400).json({ error: 'Material e quantidade são obrigatórios.' });
    }

    const qtyNum = Number(quantity);
    const priceNum = Number(unit_price) >= 0 ? Number(unit_price) : 0;

    if (qtyNum <= 0) {
      return res.status(400).json({ error: 'A quantidade de entrada deve ser maior que zero.' });
    }

    // Run atomically inside transaction
    const executeInTransaction = db.transaction(() => {
      const mat = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id) as any;
      if (!mat) {
        throw new Error('Material não encontrado.');
      }

      const stockBefore = mat.current_stock;
      const stockAfter = stockBefore + qtyNum;
      const effectivePrice = priceNum > 0 ? priceNum : mat.unit_price;
      const totalPrice = qtyNum * effectivePrice;

      // Update material stock and average cost if price provided
      db.prepare(`
        UPDATE materials
        SET current_stock = ?,
            unit_price = CASE WHEN ? > 0 THEN ? ELSE unit_price END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(stockAfter, priceNum, effectivePrice, material_id);

      // Insert movement log
      const movResult = db.prepare(`
        INSERT INTO movements (
          type, material_id, date, quantity, unit_price, total_price,
          supplier, invoice_number, stock_before, stock_after, user_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'IN',
        material_id,
        date || new Date().toISOString().replace('T', ' ').substring(0, 16),
        qtyNum,
        effectivePrice,
        totalPrice,
        supplier ? supplier.trim() : 'Fornecedor Padrão',
        invoice_number ? invoice_number.trim() : null,
        stockBefore,
        stockAfter,
        user_name || 'Almoxarife',
        notes || null
      );

      return {
        movement_id: movResult.lastInsertRowid,
        stock_before: stockBefore,
        stock_after: stockAfter,
        material_name: mat.name,
      };
    });

    const result = executeInTransaction();
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Registro de SAÍDA de material
app.post('/api/movements/out', (req, res) => {
  try {
    const { material_id, date, quantity, department_id, reason, requested_by, user_name, notes } = req.body;

    if (!material_id || !quantity || !department_id || !reason) {
      return res.status(400).json({ error: 'Material, quantidade, setor solicitante e motivo são obrigatórios.' });
    }

    const qtyNum = Number(quantity);
    if (qtyNum <= 0) {
      return res.status(400).json({ error: 'A quantidade de saída deve ser maior que zero.' });
    }

    // Run atomically inside transaction
    const executeOutTransaction = db.transaction(() => {
      const mat = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id) as any;
      if (!mat) {
        throw new Error('Material não encontrado.');
      }

      const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(department_id) as any;
      if (!dept) {
        throw new Error('Setor solicitante não encontrado.');
      }

      if (mat.current_stock < qtyNum) {
        throw new Error(`Saldo insuficiente! Estoque atual de "${mat.name}": ${mat.current_stock} ${mat.unit}, quantidade solicitada: ${qtyNum} ${mat.unit}.`);
      }

      const stockBefore = mat.current_stock;
      const stockAfter = stockBefore - qtyNum;
      const unitPrice = mat.unit_price;
      const totalPrice = qtyNum * unitPrice;

      // Update material stock
      db.prepare(`
        UPDATE materials
        SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(stockAfter, material_id);

      // Insert movement log
      const movResult = db.prepare(`
        INSERT INTO movements (
          type, material_id, date, quantity, unit_price, total_price,
          department_id, reason, requested_by, stock_before, stock_after, user_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'OUT',
        material_id,
        date || new Date().toISOString().replace('T', ' ').substring(0, 16),
        qtyNum,
        unitPrice,
        totalPrice,
        department_id,
        reason.trim(),
        requested_by ? requested_by.trim() : dept.manager,
        stockBefore,
        stockAfter,
        user_name || 'Almoxarife',
        notes || null
      );

      return {
        movement_id: movResult.lastInsertRowid,
        stock_before: stockBefore,
        stock_after: stockAfter,
        material_name: mat.name,
      };
    });

    const result = executeOutTransaction();
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 5. REQUISITIONS ENDPOINTS
// ==========================================

app.get('/api/requisitions', (req, res) => {
  try {
    const requisitions = db.prepare(`
      SELECT 
        r.id, r.req_number, r.department_id, r.requested_by, r.authorized_by,
        r.status, r.reason, r.date, r.items_json, r.total_value, r.notes, r.created_at,
        d.name AS department_name, d.code AS department_code
      FROM requisitions r
      JOIN departments d ON d.id = r.department_id
      ORDER BY r.id DESC
    `).all();

    const formatted = requisitions.map((r: any) => ({
      ...r,
      items: JSON.parse(r.items_json || '[]'),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar requisições: ' + error.message });
  }
});

app.post('/api/requisitions', (req, res) => {
  try {
    const { department_id, requested_by, authorized_by, reason, date, items, notes } = req.body;

    if (!department_id || !requested_by || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Setor, solicitante, motivo e pelo menos um item são obrigatórios para a requisição.' });
    }

    const executeReqTransaction = db.transaction(() => {
      const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(department_id) as any;
      if (!dept) {
        throw new Error('Setor não encontrado.');
      }

      // Generate next requisition number
      const lastReq = db.prepare('SELECT req_number FROM requisitions ORDER BY id DESC LIMIT 1').get() as any;
      let nextSeq = 1;
      if (lastReq && lastReq.req_number) {
        const parts = lastReq.req_number.split('-');
        if (parts.length === 3) {
          nextSeq = parseInt(parts[2], 10) + 1;
        }
      }
      const reqNumber = `REQ-2026-${String(nextSeq).padStart(4, '0')}`;
      const reqDate = date || new Date().toISOString().substring(0, 10);

      let totalReqValue = 0;
      const processedItems = [];

      // Validate all items first
      for (const item of items) {
        const mat = db.prepare('SELECT * FROM materials WHERE id = ?').get(item.material_id) as any;
        if (!mat) {
          throw new Error(`Material com ID ${item.material_id} não foi encontrado.`);
        }
        const qty = Number(item.quantity);
        if (qty <= 0) {
          throw new Error(`Quantidade inválida para o item ${mat.name}.`);
        }
        if (mat.current_stock < qty) {
          throw new Error(`Saldo insuficiente para "${mat.name}". Estoque atual: ${mat.current_stock} ${mat.unit}, requisitado: ${qty} ${mat.unit}.`);
        }

        const itemTotal = qty * mat.unit_price;
        totalReqValue += itemTotal;

        processedItems.push({
          material_id: mat.id,
          material_code: mat.code,
          material_name: mat.name,
          unit: mat.unit,
          quantity: qty,
          unit_price: mat.unit_price,
          total_price: itemTotal,
        });
      }

      // Execute inventory exits for each item
      for (const item of processedItems) {
        const mat = db.prepare('SELECT current_stock FROM materials WHERE id = ?').get(item.material_id) as any;
        const stockBefore = mat.current_stock;
        const stockAfter = stockBefore - item.quantity;

        db.prepare(`
          UPDATE materials
          SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(stockAfter, item.material_id);

        db.prepare(`
          INSERT INTO movements (
            type, material_id, date, quantity, unit_price, total_price,
            department_id, reason, requested_by, stock_before, stock_after, user_name, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'OUT',
          item.material_id,
          `${reqDate} ${new Date().toLocaleTimeString('pt-BR').substring(0, 5)}`,
          item.quantity,
          item.unit_price,
          item.total_price,
          department_id,
          `Requisição ${reqNumber}: ${reason}`,
          requested_by,
          stockBefore,
          stockAfter,
          authorized_by || 'Almoxarifado',
          notes || null
        );
      }

      // Save requisition
      const result = db.prepare(`
        INSERT INTO requisitions (
          req_number, department_id, requested_by, authorized_by,
          status, reason, date, items_json, total_value, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reqNumber,
        department_id,
        requested_by.trim(),
        authorized_by ? authorized_by.trim() : 'Almoxarifado Central',
        'COMPLETED',
        reason.trim(),
        reqDate,
        JSON.stringify(processedItems),
        totalReqValue,
        notes || null
      );

      return {
        id: result.lastInsertRowid,
        req_number: reqNumber,
        department_name: dept.name,
        department_code: dept.code,
        requested_by,
        authorized_by: authorized_by || 'Almoxarifado Central',
        status: 'COMPLETED',
        reason,
        date: reqDate,
        items: processedItems,
        total_value: totalReqValue,
        notes,
      };
    });

    const requisition = executeReqTransaction();
    res.status(201).json(requisition);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 6. DASHBOARD & KPIs STATS ENDPOINTS
// ==========================================

app.get('/api/stats', (req, res) => {
  try {
    // Total materials & total inventory value
    const totalMaterialsRes = db.prepare('SELECT COUNT(*) as count FROM materials').get() as any;
    const totalMaterials = totalMaterialsRes.count;

    const inventoryValueRes = db.prepare('SELECT SUM(current_stock * unit_price) as total_val FROM materials').get() as any;
    const totalInventoryValue = Number(inventoryValueRes.total_val) || 0;

    // Critical and Low stock count
    const lowStockCount = (db.prepare('SELECT COUNT(*) as count FROM materials WHERE current_stock <= min_quantity AND current_stock > 0').get() as any).count;
    const outOfStockCount = (db.prepare('SELECT COUNT(*) as count FROM materials WHERE current_stock <= 0').get() as any).count;

    // Critical materials list
    const criticalMaterials = db.prepare(`
      SELECT id, code, name, unit, min_quantity, unit_price, current_stock, category, location,
        (current_stock * unit_price) AS total_value,
        CASE
          WHEN current_stock <= 0 THEN 'OUT_OF_STOCK'
          ELSE 'LOW'
        END AS status
      FROM materials
      WHERE current_stock <= min_quantity
      ORDER BY (current_stock / CASE WHEN min_quantity = 0 THEN 1 ELSE min_quantity END) ASC, current_stock ASC
    `).all();

    // Movements totals
    const entriesSummary = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total_val
      FROM movements WHERE type = 'IN'
    `).get() as any;

    const exitsSummary = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total_val
      FROM movements WHERE type = 'OUT'
    `).get() as any;

    // Turnover Rate (Giro de Estoque):
    // Formula: Total Exit Cost / Average Stock Valuation
    // We calculate based on registered exits vs current valuation
    const totalExitsValue = Number(exitsSummary.total_val) || 0;
    let turnoverRate = 0;
    if (totalInventoryValue > 0) {
      // Annualized/Periodic Turnover
      turnoverRate = Number((totalExitsValue / totalInventoryValue).toFixed(2));
    }
    const averageHoldingDays = turnoverRate > 0 ? Math.round(365 / turnoverRate) : 0;

    // Movements by Department
    const deptsMovements = db.prepare(`
      SELECT 
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        COALESCE(SUM(m.quantity), 0) AS total_quantity,
        COALESCE(SUM(m.total_price), 0) AS total_value
      FROM departments d
      LEFT JOIN movements m ON m.department_id = d.id AND m.type = 'OUT'
      GROUP BY d.id
      ORDER BY total_value DESC
    `).all() as any[];

    const sumDeptsValue = deptsMovements.reduce((acc, cur) => acc + cur.total_value, 0) || 1;
    const movementsByDepartment = deptsMovements.map(d => ({
      ...d,
      percentage: Number(((d.total_value / sumDeptsValue) * 100).toFixed(1)),
    }));

    // Monthly historical comparison (Entries vs Exits)
    const monthlyHistory = [
      { month: 'Mai/26', entries_value: 12400, exits_value: 8900, entries_qty: 320, exits_qty: 210 },
      { month: 'Jun/26', entries_value: 18500, exits_value: 14200, entries_qty: 450, exits_qty: 340 },
      { month: 'Jul/26', entries_value: 15300, exits_value: 11800, entries_qty: 390, exits_qty: 290 },
      { month: 'Ago/26', entries_value: 22100, exits_value: 16400, entries_qty: 510, exits_qty: 410 },
      { month: 'Set/26', entries_value: Number(entriesSummary.total_val), exits_value: Number(exitsSummary.total_val), entries_qty: 180, exits_qty: 95 },
    ];

    res.json({
      total_materials: totalMaterials,
      total_inventory_value: totalInventoryValue,
      items_low_stock_count: lowStockCount,
      items_out_of_stock_count: outOfStockCount,
      turnover_rate: turnoverRate,
      average_holding_days: averageHoldingDays,
      total_entries_count: entriesSummary.count,
      total_entries_value: Number(entriesSummary.total_val),
      total_exits_count: exitsSummary.count,
      total_exits_value: totalExitsValue,
      movements_by_department: movementsByDepartment,
      critical_materials: criticalMaterials,
      monthly_history: monthlyHistory,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao calcular indicadores: ' + error.message });
  }
});

// Reset demo data endpoint
app.post('/api/system/reset-demo', (req, res) => {
  try {
    db.exec(`
      DELETE FROM requisitions;
      DELETE FROM movements;
      DELETE FROM materials;
      DELETE FROM departments;
      DELETE FROM users;
    `);
    seedDatabase();
    res.json({ success: true, message: 'Dados restaurados para o padrão com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao restaurar dados: ' + error.message });
  }
});

// ==========================================
// 7. VITE MIDDLEWARE & STATIC ASSET SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Controle de Estoque Pro rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
