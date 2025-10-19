# Seeds del Módulo de Contabilidad

Este directorio contiene los seeders para inicializar el módulo de contabilidad con datos esenciales.

## 📁 Archivos

### 1. `mini-puc.seed.ts`
Crea el Plan Único de Cuentas (PUC) simplificado con 30 cuentas esenciales para PYMES.

**Contenido:**
- 5 cuentas de Activos (Caja, Bancos, Clientes, Retenciones por Cobrar, Inventario)
- 4 cuentas de Pasivos (Proveedores, Gastos por Pagar, Retenciones por Pagar, IVA por Pagar)
- 3 cuentas de Patrimonio (Aportes, Utilidad, Pérdida)
- 3 cuentas de Ingresos (Ventas, Devoluciones, Ingresos Financieros)
- 13 cuentas de Gastos Operacionales (Personal, Honorarios, Impuestos, Arriendos, etc.)
- 2 cuentas de Costos (Costo de Ventas, Devoluciones en Compras)

**Características:**
- Basado en el Decreto 2650 de 1993 (Colombia)
- Cada cuenta incluye descripción detallada en español sencillo
- Códigos PUC oficiales de 4 dígitos
- Naturaleza (Débito/Crédito) correctamente asignada

### 2. `fiscal-config.seed.ts`
Crea la configuración fiscal inicial del negocio.

**Templates disponibles:**
- **Persona Jurídica (S.A.S)**: Régimen Común, Responsable de IVA
- **Persona Natural**: Régimen Simplificado, No responsable de IVA

**Datos incluidos:**
- NIT y dígito de verificación
- Razón social y nombre comercial
- Dirección fiscal, ciudad, departamento
- Régimen tributario y responsabilidades fiscales
- Configuración de facturación electrónica (desactivada por defecto)
- Email y teléfono fiscal
- CIIU y actividad económica

## 🚀 Uso

### Opción 1: Ejecutar para todos los tenants

```bash
cd backend
npm run seed:accounting -- --all
```

Esto creará el Mini-PUC y la configuración fiscal para **todos** los tenants existentes.

### Opción 2: Ejecutar para un tenant específico

```bash
cd backend
npm run seed:accounting -- --tenant=<tenant-id>
```

Reemplaza `<tenant-id>` con el ID del tenant (UUID).

### Opción 3: Listar tenants disponibles

```bash
cd backend
npm run seed:accounting
```

Sin argumentos, el script mostrará todos los tenants disponibles.

### Opción 4: Persona Natural (Régimen Simplificado)

```bash
cd backend
npm run seed:accounting -- --tenant=<tenant-id> --natural
```

### Opción 5: Configuración Personalizada

Edita el archivo `backend/src/scripts/seed-accounting.ts` en la función `seedCustomAccountingForTenant()` y ejecuta:

```bash
cd backend
npm run seed:accounting -- --tenant=<tenant-id> --custom
```

## 📋 Orden de Ejecución

**IMPORTANTE:** Antes de ejecutar los seeds de contabilidad, asegúrate de haber ejecutado el seed principal:

```bash
cd backend
npm run seed  # Crea usuarios, productos, categorías, etc.
```

Luego ejecuta los seeds de contabilidad:

```bash
cd backend
npm run seed:accounting -- --all
```

## 🔍 Verificación

Después de ejecutar los seeds, puedes verificar en la base de datos:

### Verificar Plan de Cuentas:
```sql
SELECT code, name, type, nature
FROM chart_of_accounts
WHERE tenant_id = '<tenant-id>'
ORDER BY code;
```

Deberías ver 30 cuentas.

### Verificar Configuración Fiscal:
```sql
SELECT legal_name, nit, tax_regime, is_vat_responsible
FROM fiscal_configs
WHERE tenant_id = '<tenant-id>';
```

## ⚠️ Importante

1. **Los seeds NO sobrescriben datos existentes**
   - Si ya existen cuentas o configuración para un tenant, se omitirá el seed
   - Mensaje: "El tenant ya tiene X cuentas. Omitiendo seed."

2. **Configuración de EJEMPLO**
   - Los datos fiscales creados son de EJEMPLO
   - El campo `isConfigured = false` obliga al usuario a actualizarlos
   - **Cada negocio DEBE actualizar con sus datos reales**

3. **Multi-tenancy**
   - Cada tenant tiene su propio plan de cuentas
   - Cada tenant tiene su propia configuración fiscal
   - Los seeders respetan el aislamiento de tenants

## 🛠️ Personalización

### Modificar el Mini-PUC

Edita `mini-puc.seed.ts` y agrega/modifica cuentas en el array `MINI_PUC_ACCOUNTS`.

Ejemplo de cuenta:
```typescript
{
  code: '1234',  // Código PUC oficial
  name: 'Nombre de la Cuenta',
  description: 'Descripción en español sencillo',
  nature: AccountNature.DEBIT,  // o AccountNature.CREDIT
  type: AccountType.ASSET,  // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE, COST
  level: 4  // Nivel del PUC (1-6)
}
```

### Modificar Templates Fiscales

Edita `fiscal-config.seed.ts` y modifica los objetos `DEFAULT_FISCAL_CONFIG` o `NATURAL_PERSON_FISCAL_CONFIG`.

## 📚 Documentación Adicional

- **Plan de Acción**: `backend/src/modules/accounting/Plan de accion modulo de contabilidad Nexopos.md`
- **Documentación Frontend**: `frontend/MODULO_CONTABILIDAD_COMPLETADO.md`
- **Entidades**: `backend/src/modules/accounting/entities/`

## 🎯 Próximos Pasos

Después de ejecutar los seeds:

1. ✅ Login al sistema
2. ✅ Navegar a `/accounting` (F7)
3. ✅ Actualizar configuración fiscal con datos reales
4. ✅ Realizar una venta de prueba
5. ✅ Verificar que se creó el asiento contable
6. ✅ Cerrar caja y verificar asiento de arqueo
7. ✅ Revisar reportes de IVA y P&L

## 🐛 Troubleshooting

### Error: "No se encontraron tenants"
- Ejecuta primero el seed principal: `npm run seed`

### Error: "Cannot find module"
- Asegúrate de estar en el directorio `backend/`
- Ejecuta `npm install` si es necesario

### Error de conexión a base de datos
- Verifica que PostgreSQL esté corriendo
- Revisa las variables en `.env`
- Verifica las credenciales de DB

### "El tenant ya tiene cuentas"
- Los seeds detectan datos existentes y no sobrescriben
- Para recrear, elimina manualmente las cuentas del tenant en la DB

## 📞 Soporte

Para más información sobre el módulo de contabilidad, consulta la documentación completa en la carpeta `backend/src/modules/accounting/`.
