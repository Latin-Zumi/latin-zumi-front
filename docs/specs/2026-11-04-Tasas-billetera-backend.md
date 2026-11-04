# Spec: Tasas y costos para la billetera (backend)

## Fecha
2026-11-04

## Problema
La billetera tiene que mostrar las tasas de cambio, la comisión y el interés sin que el usuario abra el modal de cambio. Hoy el back no tiene de dónde dárselos a un usuario común:

- `GET /admin/settings` tiene la comisión y el interés, pero es solo para admin.
- `GET /wallet/exchange/quote` no sirve para mostrar tasas: pide un monto, guarda una fila en `exchange_quotes` por cada consulta, tiene su límite de pedidos y devuelve la tasa con la comisión aplicada.

Por eso el front hoy muestra tasas simuladas y un "0 %" escrito a mano, aunque la comisión real sea otra.

## Solución propuesta
Un endpoint de solo lectura para cualquier usuario con sesión.

### `GET /wallet/rates`

- **Acceso:** `requireAuth`, igual que el resto de `/wallet/*`. No requiere rol admin.
- **Sin escrituras:** no guarda nada en la base.

**Respuesta `200`:**

```json
{
  "data": {
    "base": "USD",
    "rates": {
      "USD": "1",
      "ARS": "1450.25",
      "COP": "4100.50",
      "EUR": "0.92"
    },
    "observed_at": "2026-11-04T18:00:00.000Z",
    "exchange_spread_percent": "0.00",
    "interest_rates": [
      { "currency": "ARS", "annual_percent": "0.00" },
      { "currency": "COP", "annual_percent": "0.00" },
      { "currency": "EUR", "annual_percent": "0.00" },
      { "currency": "USD", "annual_percent": "0.00" }
    ]
  }
}
```

**Reglas:**

- `rates` son unidades de cada moneda por 1 USD, **sin la comisión aplicada**. Tienen que venir las cuatro monedas, aunque el usuario no tenga cuenta en ellas.
- Las tasas salen de `getExchangeRate('USD', moneda)`, el mismo servicio y la misma caché que usa la cotización.
- `observed_at` es la fecha de observación más vieja de las tasas devueltas.
- `exchange_spread_percent` y `interest_rates` salen de las mismas tablas y con el mismo formato que `GET /admin/settings`. Tienen que venir las cuatro monedas.
- No se devuelven `updated_at` ni `updated_by`: identifican al admin que hizo el cambio.
- Un cambio hecho en el panel se ve en la siguiente consulta: estos dos campos no se cachean.

**Errores:**

| Status | Código | Cuándo |
|---|---|---|
| `401` | el de `requireAuth` | Sin sesión o con el token vencido |
| `429` | el del límite de pedidos | Se superó el límite |
| `503` | `CONVERSION_UNAVAILABLE` | No se pudo obtener la tasa de alguna moneda |

Con un `503` no se devuelve una tasa parcial ni inventada, y el mensaje no incluye el detalle del proveedor. El `403` por cambio de contraseña pendiente se comporta igual que en `GET /accounts`.

**Límite de pedidos:** usar una instancia propia, no `quoteRateLimit`. El front consulta este endpoint cada vez que se abre la billetera, y eso no debe consumir el cupo de cotizaciones.

## Archivos afectados
- `src/routes/wallet.route.ts`
- `src/controllers/wallet.controller.ts`
- `src/services/` (servicio nuevo o función nueva junto a la cotización)
- `src/middleware/loginRateLimit.ts`
- `src/config/swagger.ts`
- `src/tests/`

## Pasos
1. Servicio que junta las tasas y los parámetros.
2. Ruta con `requireAuth` y límite de pedidos propio.
3. Swagger y tests.
4. Desplegar en Render y avisar al front.

## Cómo probar
- [ ] Sin token responde `401`.
- [ ] Un usuario sin rol admin recibe `200` con las cuatro monedas en `rates` y en `interest_rates`.
- [ ] Un usuario con una sola cuenta recibe igual las cuatro monedas.
- [ ] `rates` no cambia al modificar la comisión desde el panel; `exchange_spread_percent` sí, en la consulta siguiente.
- [ ] La consulta no agrega filas en `exchange_quotes`.
- [ ] Si falla el proveedor de tasas responde `503` con `CONVERSION_UNAVAILABLE`, sin detalles internos.
- [ ] La respuesta no incluye `updated_at` ni `updated_by`.
- [ ] Consultar este endpoint no consume el límite de `/wallet/exchange/quote`.

## Riesgos / notas
- **Orden de despliegue:** primero el back, después el front. El cambio del front está en la rama `feat/tasas-reales-billetera`. Sin este endpoint, la billetera avisa que no pudo cargar las tasas y deja de mostrar el resumen de la semana.
- **Comisión e interés:** el objetivo es que queden en 0 %. El endpoint devuelve lo que esté cargado, sin forzar ese valor.
- Si hay que cambiar algún nombre del contrato, lo acordamos antes y ajustamos los dos lados.
