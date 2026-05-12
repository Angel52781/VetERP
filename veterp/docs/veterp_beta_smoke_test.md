# VetERP Beta Smoke Test

Checklist de regresion critica para BETA-2 antes y despues de deploy EC2.

## Preparacion

- Usar una clinica de prueba con datos controlados.
- Confirmar que `NEXT_PUBLIC_ENABLE_DEMO_SEED=false` en produccion.
- Confirmar login con usuario de prueba con permisos operativos.
- Registrar cualquier error con ruta, accion, captura y hora aproximada.

## Checklist Principal

1. Login
   - Entrar con usuario valido.
   - Resultado esperado: redirige a seleccion de clinica o Inicio sin errores.

2. Crear cliente
   - Ir a Clientes y crear responsable con nombre, telefono y email si aplica.
   - Resultado esperado: cliente aparece en listado y ficha.

3. Crear paciente con codigo
   - Desde ficha del cliente, crear paciente con `Codigo de paciente`.
   - Resultado esperado: paciente se guarda y muestra badge `#CODIGO`.

4. Buscar paciente por codigo
   - Ir a Pacientes y buscar por el codigo creado.
   - Resultado esperado: aparece el paciente correcto.

5. Crear atencion
   - Desde Recepcion, Cliente o Paciente, iniciar atencion para el paciente.
   - Resultado esperado: se abre orden activa y se puede entrar a la ficha de orden.

6. Agregar cobro
   - En la orden, ir a Cobro y agregar un servicio/producto valido.
   - Resultado esperado: item aparece en venta y total se actualiza.

7. Registrar pago
   - Registrar pago parcial o total con metodo normal.
   - Resultado esperado: saldo cambia y la venta refleja el pago.

8. Revisar cliente y paciente
   - Volver a ficha del cliente y Paciente 360.
   - Resultado esperado: estado de cuenta compacto, atencion e historial se ven sin romper.

9. Crear cita grooming
   - Ir a Agenda y crear cita de Banos o Grooming.
   - Resultado esperado: cita aparece en Agenda y queda filtrable por area.

10. Ver grooming
    - Ir a Grooming.
    - Resultado esperado: cita de grooming/banos del dia aparece con paciente, responsable y estado.

11. Crear hospitalizacion
    - Ir a Hospitalizaciones y crear internamiento para un paciente.
    - Resultado esperado: aparece en Internados activos.

12. Registrar control
    - En hospitalizacion activa, registrar control con signos basicos.
    - Resultado esperado: ultimo control se muestra en la tarjeta.

13. Dar alta
    - Dar alta a la hospitalizacion.
    - Resultado esperado: desaparece de activos y aparece en altas recientes.

14. Revisar Paciente 360
    - Abrir ficha del paciente usado.
    - Resultado esperado: codigo, atenciones, citas, seguimientos y hospitalizaciones se muestran correctamente.

15. Revisar caja
    - Ir a Caja.
    - Resultado esperado: pagos normales aparecen en el flujo de caja/corte sin saldo a favor ni anticipos.

16. Revisar recordatorios
    - Ir a Inicio y cambiar filtros de Recordatorios.
    - Abrir "Ver lista completa" o ir a `/recordatorios`.
    - Resultado esperado: vencidos, proximos 7 dias y proximos 30 dias cargan solo pendientes y permiten abrir paciente.

## Checks Negativos Rapidos

- Intentar crear una segunda hospitalizacion activa para el mismo paciente.
- Resultado esperado: mensaje claro "Este paciente ya tiene una hospitalizacion activa." y no se crea duplicado.
- Intentar crear o editar un paciente con codigo duplicado dentro de la misma clinica.
- Resultado esperado: mensaje claro "Ya existe un paciente con ese codigo.".
- Verificar que no aparece funcionalidad descartada de anticipos, pagos a cuenta ni creditos internos.

## Cierre

- Ejecutar `npm run build`.
- Si hay errores, corregir antes de deploy.
- Despues de deploy EC2, repetir el checklist sobre la URL publica.
