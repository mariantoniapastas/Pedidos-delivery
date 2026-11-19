# Mariantonia — App de pedidos

PWA de toma de pedidos a domicilio. **Una sola app para todos los barrios**: el barrio viaja
en el link y la app se configura sola leyendo la planilla.

## Cómo funciona

```
Planilla de Google  ←→  Apps Script  ←→  index.html (esta PWA)
  catálogo por sucursal     /exec          el cliente en su celular
  barrios y horarios
  pedidos que entran
```

Cada **sucursal** tiene su catálogo y sus precios. Cada **barrio** pertenece a una sucursal y
agrega lo suyo: día y hora de entrega, cierre de pedidos, envío y alias. El cliente abre
`.../?b=parque-bernal` y ve el catálogo de la sucursal de ese barrio.

Planilla: **Mariantonia — Pedidos** (Google Drive). Todo se edita ahí, no en el código.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app. Ya no tiene catálogo adentro: lo pide al backend. |
| `manifest.json` | Hace que se instale en el celular con ícono propio. |
| `sw.js` | Service worker. Abre sin internet; no cachea el backend. |
| `portal.html` | Portal interno de la sucursal. Se entra con la clave del sistema. |
| `icon-192.png` / `icon-512.png` | Íconos, generados del logo real. |

El Apps Script **no va en el repositorio**: vive dentro de la planilla.

## Los links de cada barrio

```
https://TU-DOMINIO/?b=parque-bernal
https://TU-DOMINIO/?b=golondrinas
```

Los arma solos el panel (Ctrl+K → abajo de todo, "Links por barrio") con un botón para copiar.

Si alguien entra sin `?b=`, la app le avisa que necesita el link de su barrio. La primera vez
que entra con el link, el barrio queda guardado en su celular: así la app instalada sigue
funcionando aunque el ícono pierda el parámetro.

## El panel (Ctrl+K)

Desde una computadora, Ctrl+K (Cmd+K en Mac). Pide **la clave del backend** — la misma del
`TOKEN` en el Apps Script. Se escribe una vez por navegador y queda guardada ahí; nunca
viaja dentro del código, así que el repositorio puede ser público.

Sirve para **dar de baja productos sin stock**. Se tocan los interruptores, se toca Publicar,
y todos los barrios de esa sucursal lo ven al instante.

Para cambiar **precios, nombres, fotos o agregar productos**: la pestaña Catálogo del portal,
o la planilla. Las dos escriben en el mismo lugar.

## Qué pasa cuando alguien pide

1. El pedido se guarda en la planilla (pestañas `Pedidos` e `Items`).
1b. **Le llega un mail a la sucursal que lo entrega**, con el barrio, la fecha de entrega,
   la forma de pago y el detalle separado en fresco y freezer.
2. **El total lo calcula el servidor** leyendo los precios de la planilla, no el celular del
   cliente: no se puede manipular desde el navegador.
3. El pedido guarda su propio total, así que un aumento de precios **no toca pedidos viejos**.
4. La sucursal ve sus pedidos en la planilla y se los baja en Excel.

Para bajar los pedidos de una sucursal, en el navegador:

```
<URL del Apps Script>/exec?action=csv&suc=Quilmes Centro&token=TU-CLAVE
```

Se abre en Excel, una fila por producto, ya separado en fresco y freezer.

## Deploy

Subir los cinco archivos a la raíz del repo. GitHub Pages, Netlify o Vercel — tiene que ser
HTTPS o el service worker no arranca y la app no se puede instalar.

**En cada versión nueva, cambiar `const CACHE = 'mariantonia-v3'` en `sw.js`** por `v4`, `v5`…
Si no, los celulares que ya la tienen instalada siguen viendo la versión vieja.

Si cambiás el Apps Script: *Implementar → Administrar implementaciones → lapicito →
Versión: Nueva versión*. **Nunca "Nueva implementación"**, porque cambia la URL y la app
deja de encontrar el backend.

## El portal de la sucursal

`tu-dominio/portal.html` — se elige la **sucursal** y se escribe su **PIN**. Queda guardado en
ese navegador. Pensado para la compu o la tablet del mostrador.

**Cada sucursal tiene su PIN**, en la columna `pin` de la pestaña Sucursales. Con ese PIN el
encargado entra solo a lo suyo: sus pedidos, su catálogo, sus barrios. El selector de sucursal
le queda bloqueado y el backend rechaza cualquier pedido sobre otra, aunque se lo pida a mano.

**El TOKEN maestro sigue funcionando como PIN** y abre todas las sucursales, con el selector
habilitado. Ese es el tuyo: no hace falta repartirlo.

- Arriba se elige la sucursal; abajo, la fecha de entrega.
- **Pedidos**: cada uno es una tarjeta — cliente, barrio, piso, teléfono, pago, total. Se toca
  y se abre el detalle, separado en fresco y freezar. Botones de **Preparado**, **Entregado**
  y **Marcar cobrado**.
- **Producción**: el consolidado de esa fecha, sumado por producto, con el freezer marcado.
  Es la hoja de armado.
- **Catálogo**: el catálogo de esa sucursal, editable. Interruptor para ocultar lo que no hay,
  lápiz para cambiar precio, nombre, unidad, formatos, conservación, descripción y foto.
  Se agregan productos y módulos nuevos desde acá. Cada sucursal edita el suyo y no toca
  el de las otras.
- **Barrios**: los barrios de esa sucursal. Día y hora de entrega, día y hora de cierre,
  envío, mínimo, envío gratis, descuento por efectivo y alias. Más el botón para copiar
  el link del barrio.
- Arriba a la derecha se ve cuánto falta cobrar, que son los de efectivo sin marcar.
- **Bajar a Excel** descarga el CSV de esa sucursal.

Los pedidos nunca se mezclan: se filtran por sucursal **y** por fecha de entrega.

## La lista de precios

Los precios de pastas y salsas son **los mismos para todas las sucursales**. Viven en
`Lista.gs`, un archivo aparte dentro del mismo proyecto de Apps Script.

Para actualizar precios: editás los números en `Lista.gs` y ejecutás **`cargarLista()`** una
vez desde el editor. Antes conviene correr **`simularLista()`**, que no escribe nada y te dice
qué iría a agregar.

`cargarLista()` actualiza precio, unidad, formatos y conservación de lo que ya está, y agrega
lo que falta. **Nunca borra ni desactiva nada**, y no toca fotos, descripciones, destacados ni
disponibilidad. Al terminar, el registro (Ver → Registros) te dice:

- cuántos actualizó y agregó por sucursal;
- los que están escritos distinto que en la lista y por eso quedaron **duplicados** (por
  ejemplo "Ricota" en la planilla contra "Ricotta" en la lista) — esos los unificás a mano;
- los que están en la planilla y no en la lista (Extras, Vinoteca, Postres y cualquier otro).

Los módulos que se venden **por kilo** (Fideos, Ñoquis, Hecho a mano) llevan el medio kilo
calculado solo: la mitad del precio redondeada hacia arriba a los $50. No hay que cargarlo.

### El teléfono de cada sucursal

La pantalla final del pedido muestra un cartel de contacto con el **WhatsApp y el teléfono de
la sucursal que entrega**. Sale de la columna `telefono` de la pestaña `Sucursales`, una fila
por sucursal. Si está vacía, el cartel solo dice la dirección.

El número se escribe como lo marcarías desde un celular — `11 5555-5555`, `011 15 5555-5555` o
`+54 9 11 5555-5555`, todo sirve. La app le agrega el código de país y el 9 de celular para
armar el link de WhatsApp.

### El orden de los productos

Lo manda la columna `orden` de `Productos`. En el portal, pestaña **Catálogo**, cada producto
tiene flechas ▲▼ para subirlo o bajarlo. Se mueve **dentro de su grupo**: un raviol casero no
se mete entre los tradicionales ni una salsa entre los ñoquis. Por eso el portal muestra el
nombre del grupo cuando un módulo tiene más de uno, y las flechas de los extremos quedan
apagadas.

La primera vez que movés algo, el backend numera todo el catálogo de esa sucursal (10, 20,
30…) respetando el orden que tenía. De ahí en más, mover es intercambiar dos números.

Si preferís acomodar arrastrando filas en la planilla, **borrá antes la columna `orden`
entera**: mientras tenga números, mandan ellos y no la posición de la fila.

### Nunca copies la columna `id`

Cada producto se identifica por su `id`, y es lo que el portal usa para saber a cuál le estás
tocando el precio o el interruptor. Si copiás una fila para crear otra, queda el id repetido y
el portal termina editando siempre el primero de los dos. Si vas a duplicar filas, **borrá el
id de las copias**: el backend le pone uno nuevo y único a cada fila vacía o repetida la
próxima vez que una sucursal abre el Catálogo. Borrar ids no rompe nada — los pedidos viejos
guardan el nombre del producto, no su id.

Un producto nuevo creado desde el portal entra **al final de su grupo**, no al final de todo.

Las **categorías** también se mueven: las flechas chiquitas a la izquierda del nombre del
módulo lo suben o bajan entero, con todos sus productos adentro. Sirve cuando creás un módulo
nuevo —que siempre nace último— y lo querés más arriba. Al mover una categoría se renumera
todo el catálogo de esa sucursal de 10 en 10, respetando el orden interno de cada una.

Si querés que el catálogo quede igual que la lista impresa, ejecutá una vez
**`ordenarComoLaLista()`** desde el editor. Es aparte de `cargarLista()` a propósito:
actualizar precios nunca te desarma un orden que acomodaste a mano.

### Cómo decide la app qué va al freezer

Lo define la columna `conservacion` de cada producto, no el módulo:

### Precio, unidad y formatos

Son excluyentes. Si la columna `formatos` tiene algo, **el precio y la unidad del producto se
ignoran**: el cliente elige entre los formatos y cada uno entra como una línea distinta del
pedido. El primero de la lista es el que ve por defecto.

Se escriben `nombre=precio` separados por `;` — por ejemplo `Mediano=59000;Grande=79000` o
`1/2 kg=8300;1 kg=16600`. Los espacios no molestan. Conviene dejar el precio y la unidad
cargados igual: si algún día borrás los formatos, el producto sigue funcionando con esos
valores en vez de quedar en $0.

| Valor | Qué hace la app |
|---|---|
| `preparar` | Muestra el selector Fresco / Freezer. Si elige freezer, la fábrica lo empaca distinto |
| `apto` | Sin selector: ya viene en un formato que aguanta el freezer (salsas) |
| `congelado` | Sin selector: ya viene congelado (Línea congelada) |
| `no` | Sin selector |

## Cambios en un pedido ya hecho

**Los hace la sucursal, no el cliente.** La app no deja modificar un pedido confirmado: en la
pantalla final y en el aviso de contacto se le dice al cliente que escriba o llame a la
sucursal si quiere cambiar o agregar algo, con el teléfono de la columna `telefono` de
`Sucursales`. La sucursal edita la planilla a mano.

Se evaluó dejar que el cliente lo hiciera solo desde la app y se descartó: el pedido pago por
transferencia obligaba a llevar la cuenta de lo ya cobrado contra el nuevo total, y cualquier
error ahí cuesta un cliente. Un llamado es más barato.

## El resumen de cierre

Cuando a un barrio se le cierra el pedido, su sucursal recibe un mail con todo lo que hay que
producir, sumado por producto. Lo dispara un activador por tiempo: **ejecutar una vez la
función `crearActivador()`** desde el editor de Apps Script.

## Lo que todavía no está

- **Mercado Pago.** Hay efectivo con descuento y transferencia con alias. Si cargás un link
  de pago de MP en la columna correspondiente, se habilita.
- **Las fotos.** La columna `foto_url` de la planilla está vacía. En cuanto le pongas una URL,
  la imagen reemplaza el espacio marcado.
- **Un isotipo para el ícono.** El ícono de la app usa el logo completo; a tamaño chico el
  texto se achica mucho. Si existe una versión símbolo sin texto, queda mejor.

## Versión

`v3.0` (app) y `v1.9` (portal) — aparecen al pie de cada una. Conviene mencionarla al reportar un problema.
