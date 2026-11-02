// Validasi sederhana: mengembalikan daftar pesan error (kosong = valid)
// rules: { namaField: { label, required, type: 'string'|'int'|'number'|'date'|'enum', values, min } }
const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function validate(body, rules, { partial = false } = {}) {
  const errors = [];
  const clean = {};

  for (const [field, rule] of Object.entries(rules)) {
    const label = rule.label || field;
    const value = body ? body[field] : undefined;

    if (isBlank(value)) {
      if (rule.required && !partial) errors.push(`${label} wajib diisi`);
      continue;
    }

    switch (rule.type) {
      case 'int': {
        const n = Number(value);
        if (!Number.isInteger(n)) { errors.push(`${label} harus berupa bilangan bulat`); break; }
        if (rule.min !== undefined && n < rule.min) { errors.push(`${label} minimal ${rule.min}`); break; }
        clean[field] = n;
        break;
      }
      case 'number': {
        const n = Number(value);
        if (Number.isNaN(n)) { errors.push(`${label} harus berupa angka`); break; }
        if (rule.min !== undefined && n < rule.min) { errors.push(`${label} minimal ${rule.min}`); break; }
        clean[field] = n;
        break;
      }
      case 'date':
        if (!isDate(String(value))) errors.push(`${label} harus berformat YYYY-MM-DD`);
        else clean[field] = String(value);
        break;
      case 'enum':
        if (!rule.values.includes(value)) errors.push(`${label} harus salah satu dari: ${rule.values.join(', ')}`);
        else clean[field] = value;
        break;
      default:
        clean[field] = String(value).trim();
    }
  }

  return { errors, clean };
}

module.exports = { validate, isBlank, isDate };
