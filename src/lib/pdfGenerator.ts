import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Material, Movement, Requisition } from '../types.ts';

// Color definitions matching the dark blue / amber theme
const NAVY_DARK = [15, 23, 42]; // #0F172A
const AMBER_GOLD = [217, 119, 6]; // #D97706
const SLATE_GRAY = [100, 116, 139]; // #64748B

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function generateRequisitionPDF(req: Requisition) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top Accent Bar (Amber Industrial)
  doc.setFillColor(AMBER_GOLD[0], AMBER_GOLD[1], AMBER_GOLD[2]);
  doc.rect(0, 0, 210, 5, 'F');

  // Header Box (Deep Navy)
  doc.setFillColor(NAVY_DARK[0], NAVY_DARK[1], NAVY_DARK[2]);
  doc.rect(14, 12, 182, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REQUISIÇÃO DE SAÍDA DE MATERIAL', 20, 23);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA INTEGRADO DE GESTÃO DE ESTOQUES', 20, 30);
  doc.text('Responsável Técnico: Matheus | Almoxarifado Central', 20, 35);

  // Number & Status Tag
  doc.setFillColor(AMBER_GOLD[0], AMBER_GOLD[1], AMBER_GOLD[2]);
  doc.roundedRect(145, 17, 45, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(req.req_number, 167.5, 25, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text('STATUS: ' + req.status, 167.5, 31, { align: 'center' });

  // Requisition Details Box
  let y = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Data de Emissão:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(req.date), 48, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Setor Solicitante:', 18, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${req.department_code || ''} - ${req.department_name || 'Não informado'}`, 48, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Solicitado por:', 18, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(req.requested_by, 48, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Autorizado por:', 110, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(req.authorized_by || 'Almoxarifado Central', 135, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Finalidade / Motivo:', 110, y + 14);
  doc.setFont('helvetica', 'normal');
  const splitReason = doc.splitTextToSize(req.reason || 'Consumo operacional', 58);
  doc.text(splitReason, 110, y + 19);

  // Items Table
  const tableRows = req.items.map((item, index) => [
    String(index + 1).padStart(2, '0'),
    item.material_code,
    item.material_name,
    item.unit,
    item.quantity.toLocaleString('pt-BR'),
    formatCurrency(item.unit_price),
    formatCurrency(item.total_price),
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['Item', 'Código', 'Descrição do Material', 'UN', 'Qtd', 'Vlr. Unit.', 'Vlr. Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { fontStyle: 'bold', cellWidth: 24 },
      2: { cellWidth: 70 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;

  // Total Summary
  doc.setFillColor(241, 245, 249);
  doc.rect(120, finalY + 4, 76, 12, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR TOTAL DA REQUISIÇÃO:', 124, finalY + 11.5);
  doc.setTextColor(AMBER_GOLD[0], AMBER_GOLD[1], AMBER_GOLD[2]);
  doc.text(formatCurrency(req.total_value), 192, finalY + 11.5, { align: 'right' });

  // Observations if present
  if (req.notes) {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Observações: ${req.notes}`, 14, finalY + 22);
  }

  // Formal Signatures Block
  const sigY = Math.max(finalY + 36, 220);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Line 1: Requisitante
  doc.line(18, sigY, 68, sigY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Requisitante', 43, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(req.requested_by, 43, sigY + 9, { align: 'center' });

  // Line 2: Almoxarife Entregador
  doc.line(80, sigY, 130, sigY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Entregue por (Almoxarifado)', 105, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(req.authorized_by || 'Responsável pelo Despacho', 105, sigY + 9, { align: 'center' });

  // Line 3: Recebedor
  doc.line(142, sigY, 192, sigY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Recebido em conformidade', 167, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Assinatura / Data: ____/____/____', 167, sigY + 9, { align: 'center' });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(SLATE_GRAY[0], SLATE_GRAY[1], SLATE_GRAY[2]);
  doc.text('Documento gerado eletronicamente pelo Sistema Controle de Estoque Pro | Autenticação garantida por rastreabilidade no banco relacional.', 105, 285, { align: 'center' });

  doc.save(`Requisicao_${req.req_number}.pdf`);
}

export function generateCurrentStockPDF(materials: Material[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(NAVY_DARK[0], NAVY_DARK[1], NAVY_DARK[2]);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setFillColor(AMBER_GOLD[0], AMBER_GOLD[1], AMBER_GOLD[2]);
  doc.rect(0, 24, 297, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE POSIÇÃO ATUAL DO ESTOQUE (INVENTÁRIO FÍSICO E FINANCEIRO)', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const nowStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR');
  doc.text(`Emissão: ${nowStr} | Responsável Técnico: Matheus | Almoxarifado Central`, 14, 18);

  const totalValue = materials.reduce((acc, m) => acc + (m.current_stock * m.unit_price), 0);
  const criticalCount = materials.filter(m => m.current_stock <= m.min_quantity).length;

  const tableRows = materials.map((m, idx) => {
    let statusText = 'Normal';
    if (m.current_stock <= 0) statusText = 'RUPTURA';
    else if (m.current_stock <= m.min_quantity) statusText = 'ABAIXO DO MÍNIMO';

    return [
      String(idx + 1).padStart(2, '0'),
      m.code,
      m.name,
      m.category || 'Geral',
      m.unit,
      m.location || '-',
      m.min_quantity.toLocaleString('pt-BR'),
      m.current_stock.toLocaleString('pt-BR'),
      formatCurrency(m.unit_price),
      formatCurrency(m.current_stock * m.unit_price),
      statusText,
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Código', 'Material / Descrição', 'Categoria', 'UN', 'Localização', 'Estq. Mín.', 'Estq. Atual', 'Preço Unit.', 'Valor Total', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      2: { cellWidth: 60 },
      3: { cellWidth: 24 },
      4: { halign: 'center', cellWidth: 10 },
      5: { cellWidth: 32 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 24 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      10: { halign: 'center', fontStyle: 'bold', cellWidth: 29 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 10) {
        const text = String(data.cell.raw);
        if (text === 'RUPTURA') {
          data.cell.styles.textColor = [185, 28, 28]; // red
        } else if (text === 'ABAIXO DO MÍNIMO') {
          data.cell.styles.textColor = [217, 119, 6]; // amber
        } else {
          data.cell.styles.textColor = [22, 101, 52]; // green
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, Math.min(finalY + 4, 185), 269, 14, 2, 2, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Itens Cadastrados: ${materials.length}`, 20, Math.min(finalY + 13, 194));
  doc.text(`Itens em Atenção/Ruptura: ${criticalCount}`, 95, Math.min(finalY + 13, 194));
  doc.setTextColor(AMBER_GOLD[0], AMBER_GOLD[1], AMBER_GOLD[2]);
  doc.text(`VALOR TOTAL DO ESTOQUE: ${formatCurrency(totalValue)}`, 190, Math.min(finalY + 13, 194));

  doc.save(`Posicao_Estoque_${new Date().toISOString().substring(0, 10)}.pdf`);
}

export function generateMovementsPDF(movements: Movement[], filters?: { startDate?: string; endDate?: string }) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(NAVY_DARK[0], NAVY_DARK[1], NAVY_DARK[2]);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setFillColor(AMBER_GOLD[0], AMBER_GOLD[1], AMBER_GOLD[2]);
  doc.rect(0, 24, 297, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO HISTÓRICO DE MOVIMENTAÇÕES DE ESTOQUE', 14, 12);

  const periodText = filters?.startDate || filters?.endDate
    ? `Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Hoje'}`
    : 'Período Completo / Geral';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${periodText} | Responsável Técnico: Matheus | Almoxarifado Central`, 14, 18);

  const totalEntries = movements.filter(m => m.type === 'IN').reduce((acc, cur) => acc + cur.total_price, 0);
  const totalExits = movements.filter(m => m.type === 'OUT').reduce((acc, cur) => acc + cur.total_price, 0);

  const tableRows = movements.map((m, idx) => [
    String(idx + 1).padStart(2, '0'),
    formatDate(m.date),
    m.type === 'IN' ? 'ENTRADA' : 'SAÍDA',
    m.material_code || '-',
    m.material_name || '-',
    m.type === 'IN' ? `+${m.quantity} ${m.material_unit || ''}` : `-${m.quantity} ${m.material_unit || ''}`,
    formatCurrency(m.unit_price),
    formatCurrency(m.total_price),
    `${m.stock_before} -> ${m.stock_after}`,
    m.type === 'IN' ? (m.supplier || 'Fornecedor') : (m.department_code ? `${m.department_code} - ${m.department_name}` : 'Setor'),
    m.type === 'IN' ? (m.invoice_number || 'NF') : (m.reason || 'Consumo'),
    m.user_name || 'Almoxarife',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Data/Hora', 'Tipo', 'Código', 'Material', 'Qtd.', 'Vlr. Unit.', 'Vlr. Total', 'Saldo Rastreável', 'Origem / Destino', 'Documento / Motivo', 'Operador']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { cellWidth: 26 },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      3: { fontStyle: 'bold', cellWidth: 18 },
      4: { cellWidth: 44 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 22 },
      9: { cellWidth: 38 },
      10: { cellWidth: 40 },
      11: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 2) {
        const text = String(data.cell.raw);
        if (text === 'ENTRADA') {
          data.cell.styles.textColor = [22, 101, 52]; // green
        } else {
          data.cell.styles.textColor = [185, 28, 28]; // red
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 160;

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, Math.min(finalY + 4, 185), 269, 14, 2, 2, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Movimentações: ${movements.length}`, 20, Math.min(finalY + 13, 194));
  doc.setTextColor(22, 101, 52);
  doc.text(`Total Entradas: ${formatCurrency(totalEntries)}`, 90, Math.min(finalY + 13, 194));
  doc.setTextColor(185, 28, 28);
  doc.text(`Total Saídas: ${formatCurrency(totalExits)}`, 160, Math.min(finalY + 13, 194));
  doc.setTextColor(AMBER_GOLD[0], AMBER_GOLD[1], AMBER_GOLD[2]);
  doc.text(`Saldo Financeiro: ${formatCurrency(totalEntries - totalExits)}`, 225, Math.min(finalY + 13, 194));

  doc.save(`Relatorio_Movimentacoes_${new Date().toISOString().substring(0, 10)}.pdf`);
}
