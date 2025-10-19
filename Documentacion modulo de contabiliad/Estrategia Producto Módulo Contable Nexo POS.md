

# **Documento de Estrategia de Producto: Módulo Contable para Nexo POS (MVP)**

## **Sección 1: Marco Regulatorio y Requisitos de Producto (Colombia 2025\)**

Esta sección traduce el complejo marco fiscal colombiano en un conjunto de requisitos de producto claros, priorizados y accionables. Para cada componente normativo, se detalla el "Qué" (la norma), el "Por qué" (su impacto directo en el dueño de una PYME) y el "Cómo" (la solución funcional que Nexo POS debe implementar).

### **1.1. Impuesto sobre las Ventas (IVA): Gestión del Flujo de Caja Tributario**

El Impuesto sobre las Ventas (IVA) es uno de los pilares de la estructura tributaria en Colombia, representando una porción significativa del recaudo fiscal.1 Para el dueño de una PYME, no es un gasto, sino una responsabilidad de recaudo y un flujo de caja que debe gestionarse con precisión para asegurar la rentabilidad y evitar sanciones.

#### **1.1.1. Análisis Normativo Profundo**

**El "Qué" (La Norma):** La normativa colombiana establece múltiples tarifas de IVA. Las más relevantes para una PYME son:

* **Tarifa General:** 19% sobre la mayoría de bienes y servicios.1  
* **Tarifa Reducida:** 5% para ciertos bienes y servicios, como algunas harinas, pastas, café y azúcar.3  
* **Bienes Exentos:** Son bienes gravados con una tarifa del 0%. Incluyen productos de la canasta familiar básica como arroz, pan, huevos y leche.3  
* **Bienes Excluidos:** Son bienes que, por disposición legal, no causan el impuesto sobre las ventas. Incluyen animales vivos, hortalizas frescas y ciertos servicios educativos y de salud.4

La distinción entre "exento" y "excluido" es fundamental. Un bien **exento** (tarifa 0%) permite al productor o comerciante descontar el IVA que pagó en sus insumos y costos para producirlo, pudiendo generar un saldo a favor.5 Por el contrario, un bien **excluido** no genera IVA en la venta, pero tampoco permite descontar el IVA pagado en la cadena de producción, convirtiendo ese IVA en un costo mayor para el negocio.5

El cálculo del impuesto a pagar se basa en la fórmula: $IVA\\ Generado \- IVA\\ Descontable$.

* **IVA Generado:** Es el impuesto que el negocio cobra a sus clientes en la venta de productos o servicios gravados.  
* **IVA Descontable:** Es el impuesto que el negocio paga a sus proveedores al adquirir bienes y servicios necesarios para su operación (costo o gasto), siempre y cuando estos se destinen a operaciones gravadas.7

**El "Por Qué" (Impacto en el Negocio):** Una gestión incorrecta del IVA tiene consecuencias financieras directas. Clasificar erróneamente un producto puede reducir márgenes de ganancia. No llevar un control riguroso del IVA Descontable significa regalarle dinero a la DIAN. Las declaraciones se presentan de forma bimestral o cuatrimestral, y el incumplimiento o la extemporaneidad acarrean sanciones que van desde el 5% del impuesto a cargo, intereses moratorios, hasta el cierre del establecimiento en casos graves.2

Un aspecto crítico, y a menudo desconocido por los dueños de PYMES, es el requisito de la **Factura Electrónica de Venta** como soporte indispensable para la procedencia del IVA Descontable. Según el Estatuto Tributario (E.T.), para que el IVA de una compra sea descontable, la factura debe existir legalmente.8 En operaciones a crédito, la factura electrónica solo se considera "expedida" (y por tanto, válida) cuando el adquirente (el usuario de Nexo POS) emite dos mensajes electrónicos de confirmación a su proveedor: uno por el recibido de la factura y otro por el recibido de los bienes o servicios.8 Sin este proceso, el IVA de esa compra es, a ojos de la DIAN, improcedente. La falta de una herramienta que facilite este proceso no es un mero inconveniente, sino una fuente directa de riesgo fiscal que puede invalidar una parte significativa de los descuentos de IVA del negocio, aumentando su carga tributaria de forma inesperada.

#### **1.1.2. Requisitos Funcionales para Nexo POS**

Para traducir esta complejidad en una solución simple, Nexo POS debe implementar las siguientes funcionalidades:

1. **Configuración de Impuestos por Producto:** El sistema debe permitir al usuario, al crear o editar un producto en su catálogo, asignarle una de las siguientes categorías fiscales:  
   * Gravado \- Tarifa General (19%)  
   * Gravado \- Tarifa Reducida (5%)  
   * Exento (0%)  
   * Excluido (No aplica IVA)  
2. **Cálculo Automatizado de IVA Generado:** El módulo de ventas de Nexo POS, a partir de la configuración de cada producto, debe calcular y totalizar automáticamente el IVA Generado en cada transacción. Este total debe ser visible en tiempo real en el dashboard contable.  
3. **Interfaz de Registro de Compras y Gastos:** Se debe diseñar una interfaz intuitiva para el registro de facturas de proveedores. Esta interfaz debe permitir:  
   * La captura de la factura (idealmente vía OCR de una foto).  
   * Campos para la base gravable y el valor del **IVA Descontable** discriminado en el documento del proveedor.  
   * Un mecanismo para que el usuario confirme la recepción de la factura y los bienes/servicios, que active el envío de los mensajes de confirmación requeridos por la DIAN al proveedor (vía integración con el PTA), asegurando así la legalidad del IVA descontable.  
4. **Reporte de IVA para Declaración:** El módulo debe generar un reporte clave, denominado "Resumen de IVA", que presente de forma clara el cálculo para un período determinado (mensual o bimestral):

| Concepto | Valor |
| :---- | :---- |
| Total IVA Generado (en ventas) | $XXX.XXX$ |
| Total IVA Descontable (en compras/gastos) | $(YYY.YYY)$ |
| **Saldo a Pagar (o a Favor)** | **$ZZZ.ZZZ$** |

Este reporte será la guía principal para que el usuario o su contador diligencien el Formulario 300 de la DIAN.2

### **1.2. Retención en la Fuente (ReteFuente): El Sistema de Anticipos**

La Retención en la Fuente no es un impuesto en sí mismo, sino un mecanismo de recaudo anticipado del impuesto de renta. Para una PYME, opera en dos direcciones: como un saldo a favor cuando sus clientes le retienen, y como una obligación cuando debe retener a sus proveedores.

#### **1.2.1. Análisis Normativo Enfocado en PYMES (MVP)**

**El "Qué" (La Norma):**

* **Cuando al negocio le retienen (Saldo a Favor):** Al vender productos o prestar servicios a otra empresa (agente retenedor), esta le "retiene" un porcentaje del pago. Este monto se convierte en un crédito fiscal que el negocio podrá descontar de su impuesto de renta al final del año. Los conceptos más comunes para una PYME son 9:  
  * Retención por compras: 2.5%  
  * Retención por servicios (si el proveedor es declarante de renta): 4%  
  * Retención por servicios (si el proveedor no es declarante de renta): 6%  
  * Retención por honorarios (a personas jurídicas): 11%  
* **Cuando el negocio debe retener (Obligación):** Una persona natural o jurídica se convierte en **Agente Retenedor** y adquiere la obligación de practicar retenciones si cumple ciertas condiciones. La más relevante para una PYME en crecimiento es superar un umbral de ingresos brutos o patrimonio bruto. Para el año gravable 2025, esta obligación surge si los ingresos o patrimonio de 2024 superaron las 30,000 UVT, equivalentes a $1,411,950,000 COP.10

**El "Por Qué" (Impacto en el Negocio):** No registrar las retenciones que le practican es, literalmente, perder dinero que ya pagó por adelantado de sus impuestos. Por otro lado, si un negocio califica como agente retenedor y no cumple con su obligación de retener, declarar y pagar, se expone a sanciones severas por parte de la DIAN, que son de las más onerosas del régimen tributario.

#### **1.2.2. Requisitos Funcionales para Nexo POS (MVP)**

Dado que el umbral para ser Agente Retenedor es considerablemente alto, el MVP debe enfocarse en el escenario más frecuente y de mayor valor inmediato para la mayoría de las PYMES: la gestión de las retenciones que les practican.

1. **Registro de Retenciones a Favor:** En el flujo de registro de un pago recibido de un cliente (especialmente si es otra empresa), el sistema debe facilitar el registro de la retención. Si el pago recibido es menor al valor de la factura, el sistema debería preguntar proactivamente: *"El pago es menor al total de la factura. ¿La diferencia corresponde a una Retención en la Fuente? Registrarla te genera un saldo a favor para tu impuesto de renta."* Si la respuesta es afirmativa, se habilitarán campos para seleccionar el concepto y registrar el valor retenido.  
2. **Reporte de Saldos a Favor:** El sistema debe generar un reporte simple que totalice todos los saldos a favor por retenciones que le practicaron al negocio durante el año gravable. Este total es un dato crucial para la declaración de renta anual.  
3. **Funcionalidad para Agentes Retenedores (Post-MVP):** La funcionalidad para que el usuario actúe como agente retenedor debe considerarse para futuras versiones. Para el MVP, se puede incluir una guía educativa. Por ejemplo, al registrar un gasto por "Honorarios \- Abogado Persona Natural", el sistema podría mostrar una nota informativa: *"Recuerda: si tus ingresos anuales superan los topes establecidos por la DIAN, podrías estar obligado a practicar una retención del 10% u 11% en este tipo de pago. Consulta con tu contador."* Este enfoque educa al usuario y lo prepara para funcionalidades futuras sin sobrecargar el MVP con una lógica compleja.  
4. **Generación de Certificados:** El sistema debe tener la capacidad de generar un Certificado de Retención simple (Formato 220\) para que el usuario pueda entregarlo a sus proveedores cuando actúe como agente retenedor.

### **1.3. Facturación Electrónica: La Columna Vertebral del Cumplimiento**

La facturación electrónica es el mecanismo central de fiscalización de la DIAN y un requisito ineludible para la mayoría de las empresas en Colombia. La integración de Nexo POS con este sistema no es opcional, es la base de su legitimidad como herramienta de gestión.

#### **1.3.1. Análisis Estratégico de Modelos de Operación**

**El "Qué" (La Norma):** La DIAN establece tres modelos para la expedición de facturas electrónicas 12:

1. **Solución Gratuita DIAN:** Una plataforma web provista por la DIAN para la generación manual de facturas. No permite la integración con sistemas externos como un POS, lo que la hace inviable para un entorno automatizado.13  
2. **Desarrollo de Software Propio:** Implica que Nexo POS desarrolle y certifique su propia conexión directa con los servicios web de la DIAN. Este proceso es extremadamente costoso, consume mucho tiempo (meses o incluso años) y requiere un equipo de ingeniería dedicado permanentemente a mantener la conformidad con las cambiantes regulaciones técnicas de la DIAN. Es una estrategia de alto riesgo e ineficiente para un MVP.  
3. **Proveedor Tecnológico Autorizado (PTA):** Consiste en contratar los servicios de una empresa ya certificada por la DIAN. Estos proveedores ofrecen una API (Interfaz de Programación de Aplicaciones) que permite a sistemas como Nexo POS enviar la información de la venta. El PTA se encarga de todo el proceso complejo: validación, firma digital, generación del CUFE (Código Único de Factura Electrónica), comunicación con la DIAN y devolución de los documentos fiscales (XML y PDF).16

**El "Por Qué" (Análisis de Viabilidad):** La integración a través de un **Proveedor Tecnológico Autorizado (PTA)** es, sin lugar a dudas, la estrategia más segura, rápida y escalable para el MVP de Nexo POS. Delega la complejidad y el riesgo del cumplimiento normativo a un especialista, permitiendo que el equipo de Nexo POS se enfoque en su *core business*: la experiencia de usuario en el punto de venta y la gestión del negocio.

#### **1.3.2. Requisitos Funcionales y Flujo de Datos**

1. **Selección de Proveedor Tecnológico:** Se debe realizar una evaluación técnica y comercial de los principales PTAs en Colombia. La siguiente tabla presenta una lista inicial para análisis:

| Proveedor Tecnológico Autorizado (PTA) | NIT | Documentación API (Referencial) |
| :---- | :---- | :---- |
| SIIGO S.A.S | 830048145 | [developer.siigo.com](https://developer.siigo.com/) 18 |
| SOLUCIONES ALEGRA S.A.S | 900559088 | [developer.alegra.com](https://developer.alegra.com/) 19 |
| THE FACTORY HKA COLOMBIA S.A.S. | 900390126 | N/A (Requiere contacto directo) |
| CARVAJAL TECNOLOGIA Y SERVICIOS S.A.S. BIC | 890321151 | N/A (Requiere contacto directo) |
| DATAICO S.A.S | 901223648 | N/A (Requiere contacto directo) |
| CADENA S.A. | 890930534 | N/A (Requiere contacto directo) |
| GESTION DE SEGURIDAD ELECTRONICA S.A (GSE) | 900204272 | N/A (Requiere contacto directo) |
| (Fuentes: 16) |  |  |

2. **Recolección de Datos en Nexo POS:** El sistema debe garantizar la captura completa de la información requerida para una factura electrónica válida, incluyendo:  
   * **Datos del Emisor:** Razón Social, NIT, dirección, responsabilidades fiscales (obtenidos durante el onboarding del usuario en el módulo contable).  
   * **Datos del Adquirente (Cliente):** Tipo de identificación, número, nombre, dirección, correo electrónico (capturados desde el módulo de clientes del POS).  
   * **Detalles de la Transacción:** Fecha, hora, número de factura, forma y medio de pago.  
   * **Detalles de Productos/Servicios:** Código, descripción, cantidad, unidad de medida, valor unitario, valor total, impuestos (IVA) y descuentos aplicados.  
3. **Flujo de Datos Propuesto (Integración vía API con PTA):**  
   * **Paso 1 (Nexo POS):** El usuario finaliza una venta en el POS y selecciona la opción "Generar Factura Electrónica".  
   * **Paso 2 (API Call):** El backend de Nexo POS construye un objeto (generalmente JSON) con toda la información recolectada y lo envía de forma segura al endpoint de la API del PTA.  
   * **Paso 3 (PTA):** El PTA recibe la solicitud, valida la estructura y los datos, aplica la firma digital del facturador, genera el Código Único de Factura Electrónica (CUFE), construye el archivo XML estándar (UBL 2.1) y lo envía a los servicios web de la DIAN para su validación.  
   * **Paso 4 (DIAN):** La DIAN procesa el XML en tiempo real, realiza sus validaciones y devuelve una respuesta (ApplicationResponse) al PTA, indicando si la factura fue aprobada o rechazada (con los motivos del rechazo).  
   * **Paso 5 (API Response / Webhook):** El PTA notifica al sistema de Nexo POS sobre el resultado. Si fue aprobada, el PTA devuelve el XML validado y la representación gráfica (PDF) de la factura.  
   * **Paso 6 (Nexo POS):** El sistema almacena el XML y el PDF como soporte legal, actualiza el estado de la venta a "Facturada Electrónicamente" y habilita la opción para enviar automáticamente los documentos por correo electrónico al cliente final.

## **Sección 2: Estrategia de Experiencia de Usuario (UX) \- "Contabilidad Invisible"**

El objetivo de esta estrategia es abstraer por completo la complejidad y la jerga contable. El usuario no debe sentir que está "haciendo contabilidad"; debe sentir que está gestionando su negocio de una manera más inteligente y organizada. Las acciones deben ser rápidas, intuitivas y estar en el lenguaje del día a día de un comerciante.

### **2.1. Análisis Competitivo de UX: Lecciones de Alegra y Wave**

Se ha realizado un análisis de dos plataformas líderes, una con un fuerte enfoque en el mercado colombiano (Alegra) y otra reconocida internacionalmente por su simplicidad (Wave), para extraer principios de diseño aplicables a Nexo POS.

#### **2.1.1. Deconstrucción de Flujos Clave**

* **Alegra (Colombia):**  
  * **Registro de Gasto:** El flujo de Alegra para registrar un "Pago" o "Factura de Compra" es estructurado y funcional. Separa claramente la información del proveedor, las fechas y los montos de la imputación contable.21 Permite asociar el pago a una factura de proveedor existente o a una cuenta contable directamente.23 Si bien es completo, requiere que el usuario entienda conceptos como "cuenta contable" o "retenciones".22  
  * **Dashboard y Reportes:** El dashboard de Alegra ofrece una visión general de las ventas, gastos y saldos bancarios. Sus reportes fiscales, como el "Reporte detallado de impuestos", son robustos y permiten ver el IVA generado y descontable.24 Sin embargo, la presentación de la información financiera principal, como el "Estado de situación financiera", sigue utilizando terminología técnica que puede ser intimidante para un no contador.26  
* **Wave (Internacional):**  
  * **Registro de Gasto:** La fortaleza de Wave radica en su simplicidad radical, especialmente en la captura de gastos. Su funcionalidad de escaneo de recibos a través de la app móvil es el estándar de oro.27 El usuario toma una foto, el sistema utiliza OCR para extraer los datos clave (proveedor, fecha, monto) y crea la transacción de gasto automáticamente, minimizando la entrada manual de datos.27  
  * **Dashboard:** El dashboard de Wave es un ejemplo magistral de "contabilidad invisible". En lugar de presentar tablas de datos, responde directamente a las preguntas del empresario a través de widgets visuales muy claros: un gráfico de barras para el Flujo de Caja (Cash Flow), otro para Ganancias y Pérdidas (Profit & Loss), y un gráfico circular para el Desglose de Gastos (Expenses Breakdown).29 Esto permite una comprensión financiera instantánea sin necesidad de conocimientos previos.

#### **2.1.2. Los 10 Mandamientos de la Simplicidad Contable para Nexo POS**

Basado en el análisis anterior, se proponen los siguientes principios de diseño como guía para el equipo de UX/UI:

1. **Hablar el Idioma del Negocio, no del Contador:** Utilizar términos como "Ganancias", "Dinero disponible", "Plata para la DIAN" en lugar de "Utilidad Neta", "Efectivo y Equivalentes", "Impuestos por Pagar".  
2. **La Cámara es el Nuevo Teclado:** Priorizar la captura de información de gastos a través de la cámara del móvil con tecnología OCR. El objetivo debe ser que registrar un gasto sea tan fácil como tomar una foto.  
3. **Una Acción, Múltiples Efectos (Ocultos):** El usuario realiza una acción simple (ej. "registrar venta"). El sistema, en segundo plano, debe generar todos los asientos contables de partida doble necesarios sin que el usuario lo perciba.  
4. **Visualizar Respuestas, no solo Datos:** Los gráficos y widgets del dashboard no deben limitarse a mostrar números. Deben responder preguntas fundamentales de forma visual e inmediata: "¿Gané o perdí dinero este mes?".  
5. **La Pregunta del Millón Primero:** La información más crítica y que más ansiedad genera en un empresario es saber cuánto dinero debe reservar para impuestos. Este dato debe tener un lugar prominente y claro en el dashboard.  
6. **Cero Jerga, Cero Códigos:** El usuario nunca debe ver un código del PUC (ej. 5135\) ni términos como "débito" o "crédito" en la interfaz principal. La categorización debe ser mediante íconos y lenguaje natural.  
7. **Guiar, no solo Permitir:** El software debe ser un asistente proactivo. En lugar de solo ofrecer un campo para "retención", debe preguntar y guiar al usuario cuando detecte un escenario probable de retención.  
8. **El Camino Más Corto a la Acción:** Cada flujo de trabajo debe ser optimizado para el menor número de clics o toques posibles. Registrar un gasto no debería tomar más de 30 segundos.  
9. **Consistencia con el POS:** El diseño, la tipografía, los colores y la lógica de interacción del módulo contable deben sentirse como una extensión natural del Nexo POS existente, no como una aplicación separada.  
10. **La Automatización es la Meta Final:** Desde el registro de una venta hasta la conciliación bancaria, el objetivo a largo plazo es automatizar la mayor cantidad posible de procesos para que el usuario solo tenga que supervisar y tomar decisiones.

### **2.2. Diseño de Flujos de Usuario Fundamentales**

A continuación, se describen dos flujos de usuario críticos que encarnan la filosofía de "Contabilidad Invisible".

#### **2.2.1. Diagrama de Flujo \- "Tengo una factura, ¿ahora qué?"**

Este flujo detalla el proceso para registrar un gasto operativo en menos de 30 segundos.

Fragmento de código

graph TD  
    A \--\> B{Activar Cámara};  
    B \--\> C\[Usuario toma foto de la factura\];  
    C \--\> D;  
    D \-- Extrae: Proveedor, NIT, Fecha, Total, IVA \--\> E\[Pantalla de Confirmación\];  
    E \--\> F{¿Qué tipo de gasto es?};  
    F \-- Muestra cuadrícula de íconos \--\> G;  
    F \--\> H\[🛒 Compra de Inventario\];  
    F \--\> I\[🏢 Arriendo\];  
    F \--\> J\[➕ Otro\];  
    G \-- Usuario selecciona ícono \--\> K;  
    H \-- Usuario selecciona ícono \--\> K;  
    I \-- Usuario selecciona ícono \--\> K;  
    J \-- Usuario selecciona ícono \--\> K;  
    K{¿Cómo lo pagaste?};  
    K \-- Muestra íconos de pago \--\> L\[💵 Caja\];  
    K \--\> M;  
    L \-- Usuario selecciona método \--\> N;  
    M \-- Usuario selecciona método \--\> N;  
    N \--\> O;

#### **2.2.2. Diseño Conceptual \- "El Vistazo de 5 Minutos" (Dashboard)**

El dashboard principal es la cara del módulo contable. Debe ser diseñado para ofrecer máxima claridad con mínimo esfuerzo cognitivo. Se compondrá de cinco widgets visuales que responden a las preguntas más importantes del dueño del negocio.

**Mockup Conceptual del Dashboard de Nexo POS:**

* **Widget 1: ¿Cuánto vendí?**  
  * **Título:** Ventas de \[Mes\]  
  * **Visual:** Un número grande y prominente (ej. $15.450.000) con una pequeña línea de tendencia debajo que compara con el mes anterior.  
* **Widget 2: ¿Cuánto gasté?**  
  * **Título:** Gastos de \[Mes\]  
  * **Visual:** Un número grande (ej. $9.800.000) y a su lado un gráfico de torta simple mostrando las 3 categorías principales (ej. 50% Inventario, 20% Arriendo, 10% Servicios, 20% Otros).  
* **Widget 3: ¿Estoy ganando o perdiendo dinero?**  
  * **Título:** Ganancia Neta (antes de impuestos)  
  * **Visual:** Un único número, grande, con un color distintivo. Verde si es positivo (ej. $2.150.000), rojo si es negativo.  
* **Widget 4: ¿Cuánto dinero tengo?**  
  * **Título:** Dinero Disponible  
  * **Visual:** Dos números más pequeños uno al lado del otro: Caja: $1.200.000 y Bancos: $7.500.000.  
* **Widget 5: La pregunta del millón: ¿Cuánto debo apartar para la DIAN?**  
  * **Título:** Provisión para Impuestos  
  * **Visual:** Un widget destacado, quizás con un borde o color de alerta sutil. Contendrá un número grande y claro (ej. $1.850.000) con una descripción debajo: (IVA a pagar \+ Retenciones practicadas). Este es el valor que el usuario debe tener mentalmente (o físicamente) separado para cumplir sus obligaciones tributarias del período.

## **Sección 3: Propuesta de Arquitectura Técnica y de Datos**

La simplicidad de la interfaz de usuario debe estar soportada por una arquitectura de datos robusta y lógicamente correcta en el backend. Esta sección define el esqueleto técnico que permitirá la "traducción" de acciones de negocio simples a registros contables formales.

### **3.1. El Traductor Interno: Plan de Cuentas (PUC) Simplificado**

El Plan Único de Cuentas para comerciantes, establecido por el Decreto 2650 de 1993, es la estructura contable estándar en Colombia.31 Aunque su uso completo es demasiado complejo para el usuario final de Nexo POS, es indispensable como estructura interna para garantizar el cumplimiento normativo y la generación de reportes financieros válidos.

Por lo tanto, se propone la implementación de un **"Mini-PUC" interno**. Este será un subconjunto curado de no más de 30-40 cuentas esenciales que cubren la gran mayoría de las operaciones de una PYME de comercio o servicios. Este Mini-PUC será completamente invisible para el usuario, pero será el lenguaje que el sistema hable internamente.

La siguiente tabla detalla el Mini-PUC propuesto para el MVP, incluyendo el mapeo crucial desde la experiencia de usuario (la acción o el ícono que el usuario selecciona) hasta la cuenta contable formal que se afecta en el backend.

| Código PUC | Nombre de la Cuenta | Naturaleza | Mapeo de UX (Acción/Ícono del Usuario) |
| :---- | :---- | :---- | :---- |
| **ACTIVO** |  |  |  |
| 1105 | Caja | Débito | Venta en efectivo; Pago de gasto desde "Caja" |
| 1110 | Bancos | Débito | Venta con tarjeta/transferencia; Pago de gasto desde "Banco" |
| 1305 | Clientes | Débito | Venta a crédito ("fiado") |
| 135515 | Retención en la Fuente | Débito | Registro de "Retención que me practicaron" |
| 1435 | Mercancías no fabricadas por la empresa | Débito | Ícono "🛒 Compra de Inventario" |
| **PASIVO** |  |  |  |
| 2205 | Proveedores Nacionales | Crédito | Compra de inventario a crédito |
| 2335 | Costos y Gastos por Pagar | Crédito | Registro de gasto a crédito (ej. arriendo, servicios) |
| 2365 | Retención en la Fuente | Crédito | (Post-MVP) Cuando el usuario practica una retención |
| 2408 | Impuesto sobre las Ventas por Pagar | Crédito | Cálculo de IVA Generado (ventas) e IVA Descontable (compras) |
| **PATRIMONIO** |  |  |  |
| 3115 | Aportes Sociales | Crédito | Configuración inicial de la empresa |
| 3605 | Utilidad del Ejercicio | Crédito | Cierre contable automático al final del período |
| **INGRESOS** |  |  |  |
| 4135 | Comercio al por mayor y al por menor | Crédito | Venta de productos en el POS |
| 4175 | Devoluciones en ventas (DB) | Débito | Procesamiento de una devolución en el POS |
| 4210 | Financieros | Crédito | (Avanzado) Registro de intereses ganados |
| **GASTOS** |  |  |  |
| 5105 | Gastos de Personal | Débito | Ícono "🧑‍💼 Nómina / Sueldos" |
| 5110 | Honorarios | Débito | Ícono "⚖️ Servicios Profesionales" (abogado, contador) |
| 5115 | Impuestos | Débito | Registro de pago de impuestos (ej. Industria y Comercio) |
| 5120 | Arrendamientos | Débito | Ícono "🏢 Arriendo" |
| 5130 | Seguros | Débito | Ícono "🛡️ Seguros" |
| 5135 | Servicios | Débito | Ícono "💡 Servicios Públicos", "🌐 Internet y Teléfono" |
| 5145 | Mantenimiento y Reparaciones | Débito | Ícono "🔧 Mantenimiento" |
| 5155 | Gastos de Viaje | Débito | Ícono "✈️ Viáticos / Viajes" |
| 5160 | Depreciación | Débito | (Avanzado) Cálculo automático de depreciación |
| 5195 | Diversos | Débito | Ícono "➕ Otro Gasto" |
| 5205 | Gastos de Personal (Ventas) | Débito | (Avanzado) Separación de gastos de venta y admon. |
| **COSTO DE VENTAS** |  |  |  |
| 6135 | Comercio al por mayor y al por menor | Débito | Asiento automático al realizar una venta de inventario |

### **3.2. La Lógica Automatizada: Diagramas de Asientos Contables**

Cada acción del usuario en la interfaz simple de Nexo POS debe desencadenar la creación automática de un asiento contable de partida doble en el backend. Esta automatización es el núcleo del motor contable.

#### **3.2.1. Diagrama de Asiento \- Venta en POS (Contado con IVA)**

* **Evento de Usuario:** El cajero realiza una venta de un producto gravado con IVA del 19% por un total de $119,000 COP, pagada en efectivo. El costo del producto en el inventario era de $70,000.  
* **Asientos Contables Automáticos (Partida Doble):**  
  1. **Registro del Ingreso y el Efectivo:**  
     * **Débito** a 1105 \- Caja por $119,000 (Aumenta el activo disponible).  
     * **Crédito** a 4135 \- Comercio al por mayor y al por menor por $100,000 (Aumenta el ingreso).  
     * **Crédito** a 2408 \- Impuesto sobre las ventas por pagar por $19,000 (Aumenta el pasivo con la DIAN).  
  2. **Registro del Costo de Venta y Salida de Inventario:**  
     * **Débito** a 6135 \- Comercio al por mayor y al por menor por $70,000 (Aumenta el costo de la venta).  
     * **Crédito** a 1435 \- Mercancías no fabricadas por la empresa por $70,000 (Disminuye el activo de inventario).

#### **3.2.2. Diagrama de Asiento \- Registro de Gasto (Servicios Públicos con IVA)**

* **Evento de Usuario:** El dueño del negocio toma una foto de la factura de energía. El OCR extrae un total de $238,000 (Base $200,000 \+ IVA 19% $38,000). El usuario selecciona el ícono "💡 Servicios Públicos" y lo marca como "Pagado desde Banco".  
* **Asiento Contable Automático (Partida Doble):**  
  * **Débito** a 5135 \- Servicios por $200,000 (Aumenta el gasto operacional).  
  * **Débito** a 2408 \- Impuesto sobre las ventas por pagar (subcuenta IVA Descontable) por $38,000 (Disminuye el pasivo con la DIAN, actuando como un "contra-pasivo").  
  * **Crédito** a 1110 \- Bancos por $238,000 (Disminuye el activo disponible).

#### **3.2.3. Diagrama de Asiento \- Venta a Crédito con Retención en la Fuente**

* **Evento de Usuario:** Se realiza una venta a crédito a otra empresa por un servicio de $1,000,000 (más IVA de $190,000). El cliente paga posteriormente, pero retiene el 4% sobre la base por concepto de servicios ($40,000). El usuario registra el pago recibido en el banco por $1,150,000 y marca que le practicaron una retención de $40,000.  
* **Asientos Contables Automáticos (Partida Doble):**  
  1. **Registro de la Venta a Crédito (Inicial):**  
     * **Débito** a 1305 \- Clientes por $1,190,000 (Aumenta la cuenta por cobrar).  
     * **Crédito** a 4135 \- Comercio al por mayor y al por menor por $1,000,000 (Aumenta el ingreso).  
     * **Crédito** a 2408 \- Impuesto sobre las ventas por pagar por $190,000 (Aumenta el pasivo con la DIAN).  
  2. **Registro del Pago y la Retención (Posterior):**  
     * **Débito** a 1110 \- Bancos por $1,150,000 (Aumenta el activo disponible).  
     * **Débito** a 135515 \- Retención en la Fuente por $40,000 (Aumenta el activo "saldo a favor").  
     * **Crédito** a 1305 \- Clientes por $1,190,000 (Cancela la cuenta por cobrar).

La arquitectura de datos debe ser diseñada pensando en la escalabilidad. El mapeo entre las acciones de la UX y las cuentas del PUC no debe estar codificado de forma rígida en la lógica de la aplicación. En su lugar, debe existir una tabla de configuración o un sistema de reglas que defina estas asociaciones. Este enfoque permitirá que en el futuro se puedan añadir nuevos tipos de negocios (ej. restaurantes, consultorios) con sus propias cuentas contables específicas (ej. "Costo de materia prima", "Ingresos por honorarios") simplemente actualizando la configuración, sin necesidad de reescribir el núcleo del motor contable. Esto previene una deuda técnica significativa y asegura la viabilidad del producto a largo plazo.

#### **Obras citadas**

1. IVA en Colombia: cuáles son las tasas, cómo se calcula y qué impacto tiene el impuesto en el bolsillo \- BBVA, fecha de acceso: octubre 17, 2025, [https://www.bbva.com/es/salud-financiera/iva-en-colombia-cuales-son-las-tasas-como-se-calcula-y-que-impacto-tiene-el-impuesto-en-el-bolsillo/](https://www.bbva.com/es/salud-financiera/iva-en-colombia-cuales-son-las-tasas-como-se-calcula-y-que-impacto-tiene-el-impuesto-en-el-bolsillo/)  
2. IVA en Colombia 2025: fechas, tarifas y cómo declararlo \- Treinta, fecha de acceso: octubre 17, 2025, [https://www.treinta.co/blog/iva-colombia-2025](https://www.treinta.co/blog/iva-colombia-2025)  
3. Tabla IVA Canasta Familiar \- DIAN, fecha de acceso: octubre 17, 2025, [https://www.dian.gov.co/impuestos/Reforma%20Tributaria%20Estructural/Listado%20completo%20IVA%20Canasta%20Familiar.pdf](https://www.dian.gov.co/impuestos/Reforma%20Tributaria%20Estructural/Listado%20completo%20IVA%20Canasta%20Familiar.pdf)  
4. Impuesto (IVA) \- Biblioteca Digital CCB, fecha de acceso: octubre 17, 2025, [https://bibliotecadigital.ccb.org.co/bitstreams/c0132ca2-b08d-409c-a9f2-cfbd5e229550/download](https://bibliotecadigital.ccb.org.co/bitstreams/c0132ca2-b08d-409c-a9f2-cfbd5e229550/download)  
5. Diferencia entre bienes gravados, exentos y excluidos de IVA, fecha de acceso: octubre 17, 2025, [https://siemprealdia.co/colombia/impuestos/bienes-gravados-exentos-y-excluidos-de-iva/](https://siemprealdia.co/colombia/impuestos/bienes-gravados-exentos-y-excluidos-de-iva/)  
6. Exempt, excluded and apportioned VAT goods: calculation, application and effects, fecha de acceso: octubre 17, 2025, [https://www.youtube.com/watch?v=7yONsosh-oM](https://www.youtube.com/watch?v=7yONsosh-oM)  
7. IMPUESTO DESCONTABLE – Lo es el iva facturado por la adquisición de bienes corporales muebles \- CONSEJO DE ESTADO, fecha de acceso: octubre 17, 2025, [https://www.consejodeestado.gov.co/documentos/boletines/PDF/25000-23-27-000-2006-00792-01(16818).pdf](https://www.consejodeestado.gov.co/documentos/boletines/PDF/25000-23-27-000-2006-00792-01\(16818\).pdf)  
8. Problema: 1 (CONCEPTO 002999 – int 0824 DE 2024 MAYO ... \- DIAN, fecha de acceso: octubre 17, 2025, [https://www.dian.gov.co/Contribuyentes-Plus/Documents/CONCEPTO-002999-Int-0824-08052024.pdf](https://www.dian.gov.co/Contribuyentes-Plus/Documents/CONCEPTO-002999-Int-0824-08052024.pdf)  
9. Conoce las nuevas las tarifas de Retención en la Fuente ... \- Siigo.com, fecha de acceso: octubre 17, 2025, [https://www.siigo.com/blog/tabla-de-retencion-en-la-fuente/](https://www.siigo.com/blog/tabla-de-retencion-en-la-fuente/)  
10. Personas naturales retenedoras en 2025 | Actualícese, fecha de acceso: octubre 17, 2025, [https://actualicese.com/personas-naturales-retenedoras-2025/](https://actualicese.com/personas-naturales-retenedoras-2025/)  
11. Retención en la fuente: ¿cuándo aplica para personas naturales en Colombia? \- Actualícese, fecha de acceso: octubre 17, 2025, [https://actualicese.com/retencion-en-la-fuente-cuando-aplica-para-personas-naturales-en-colombia/](https://actualicese.com/retencion-en-la-fuente-cuando-aplica-para-personas-naturales-en-colombia/)  
12. plantillas factura electrónica \- DIAN, fecha de acceso: octubre 17, 2025, [https://www.dian.gov.co/impuestos/factura-electronica/Documents/Plantillas-Facturacion-Gratuita-DIAN.pdf](https://www.dian.gov.co/impuestos/factura-electronica/Documents/Plantillas-Facturacion-Gratuita-DIAN.pdf)  
13. Proceso Factura Electrónica \- DIAN, fecha de acceso: octubre 17, 2025, [https://www.dian.gov.co/impuestos/factura-electronica/Documents/Guia-de-Facturacion-Gratuita-DIAN.pdf](https://www.dian.gov.co/impuestos/factura-electronica/Documents/Guia-de-Facturacion-Gratuita-DIAN.pdf)  
14. Guía de uso Facturación Gratuita DIAN, fecha de acceso: octubre 17, 2025, [https://www.dian.gov.co/impuestos/factura-electronica/Documents/Guia\_uso\_facturacion\_gratuita\_DIAN.pdf](https://www.dian.gov.co/impuestos/factura-electronica/Documents/Guia_uso_facturacion_gratuita_DIAN.pdf)  
15. Abecé Sistema de Factura Electrónica \- DIAN, fecha de acceso: octubre 17, 2025, [https://www.dian.gov.co/Prensa/Aprendelo-en-un-DIAN-X3/Paginas/Abece-Sistema-de-Factura-Electronica.aspx](https://www.dian.gov.co/Prensa/Aprendelo-en-un-DIAN-X3/Paginas/Abece-Sistema-de-Factura-Electronica.aspx)  
16. Proveedores de facturación electrónica: solo los autorizados | Blog \- Siigo.com, fecha de acceso: octubre 17, 2025, [https://www.siigo.com/blog/empresario/proveedores-autorizados-facturacion-electronica/](https://www.siigo.com/blog/empresario/proveedores-autorizados-facturacion-electronica/)  
17. Proveedores Tecnológicos Autorizados por la DIAN afiliados a la CCCE, fecha de acceso: octubre 17, 2025, [https://ccce.org.co/noticias/proveedores-tecnologicos-autorizados-por-la-dian-afiliados-a-la-ccce/](https://ccce.org.co/noticias/proveedores-tecnologicos-autorizados-por-la-dian-afiliados-a-la-ccce/)  
18. Manual de Integración API \- NET, fecha de acceso: octubre 17, 2025, [https://saprodcentralassets.blob.core.windows.net/siigoapi/documentation/Documentaci%C3%B3n%20Siigo%20API.pdf](https://saprodcentralassets.blob.core.windows.net/siigoapi/documentation/Documentaci%C3%B3n%20Siigo%20API.pdf)  
19. API de Facturación Electrónica en Colombia \- Alegra API, fecha de acceso: octubre 17, 2025, [https://www.alegra.com/colombia/api/facturacion-electronica/](https://www.alegra.com/colombia/api/facturacion-electronica/)  
20. www.dian.gov.co, fecha de acceso: octubre 17, 2025, [https://www.dian.gov.co/impuestos/factura-electronica/Documents/Listado-de-Proveedores-Tecnologicos-Octubre-2022.xlsx](https://www.dian.gov.co/impuestos/factura-electronica/Documents/Listado-de-Proveedores-Tecnologicos-Octubre-2022.xlsx)  
21. Registra tus gastos y egresos en Alegra \- General, fecha de acceso: octubre 17, 2025, [https://ayuda.alegra.com/int/c%C3%B3mo-registrar-un-egreso-en-alegra](https://ayuda.alegra.com/int/c%C3%B3mo-registrar-un-egreso-en-alegra)  
22. Registra tus gastos y egresos en Alegra \- General, fecha de acceso: octubre 17, 2025, [https://ayuda.alegra.com/col/registrar-egreso-en-ac-col](https://ayuda.alegra.com/col/registrar-egreso-en-ac-col)  
23. Cómo registrar gastos en Alegra Contabilidad \- \#Colombia \- YouTube, fecha de acceso: octubre 17, 2025, [https://www.youtube.com/watch?v=us\_K31va1b0](https://www.youtube.com/watch?v=us_K31va1b0)  
24. Cómo generar y exportar el reporte detallado de impuestos \- Alegra, fecha de acceso: octubre 17, 2025, [https://ayuda.alegra.com/arg/reporte-detallado-de-impuestos](https://ayuda.alegra.com/arg/reporte-detallado-de-impuestos)  
25. Crea un reporte detallado con los impuestos de tus transacciones, fecha de acceso: octubre 17, 2025, [https://ayuda.alegra.com/col/reporte-de-impuestos-y-retenciones](https://ayuda.alegra.com/col/reporte-de-impuestos-y-retenciones)  
26. Cómo cruzar saldos de impuestos en Alegra \- General, fecha de acceso: octubre 17, 2025, [https://ayuda.alegra.com/int/c%C3%B3mo-cruzar-saldos-de-impuestos-en-alegra](https://ayuda.alegra.com/int/c%C3%B3mo-cruzar-saldos-de-impuestos-en-alegra)  
27. Scan and upload your receipts – Help Center, fecha de acceso: octubre 17, 2025, [https://support.waveapps.com/hc/en-us/articles/360059848112-Scan-and-upload-your-receipts](https://support.waveapps.com/hc/en-us/articles/360059848112-Scan-and-upload-your-receipts)  
28. How To Scan Receipt Expense Into Wave Apps \- YouTube, fecha de acceso: octubre 17, 2025, [https://www.youtube.com/watch?v=z12tyjwButs](https://www.youtube.com/watch?v=z12tyjwButs)  
29. Wave's dashboard tour | Wave Tutorial \- YouTube, fecha de acceso: octubre 17, 2025, [https://www.youtube.com/watch?v=liy-T2VCwHU](https://www.youtube.com/watch?v=liy-T2VCwHU)  
30. Introduction to Wave Accounting for YouTubers (2020), fecha de acceso: octubre 17, 2025, [https://www.nutsaccounting.com/blog/20200114-wave-accounting-tutorial-introduction-to-wave-accounting-for-youtubers-2020](https://www.nutsaccounting.com/blog/20200114-wave-accounting-tutorial-introduction-to-wave-accounting-for-youtubers-2020)  
31. DECRETO 2650 DE DICIEMBRE 29 DE 1993 \- Cámara de Comercio de Tumaco, fecha de acceso: octubre 17, 2025, [https://www.cctumaco.org/wp-content/uploads/2023/12/DECRETO-2650-DE-1993.pdf](https://www.cctumaco.org/wp-content/uploads/2023/12/DECRETO-2650-DE-1993.pdf)  
32. DECRETO 2650 DE 1993 (INCLUYE LAS MODIFICACIONES ..., fecha de acceso: octubre 17, 2025, [https://www.ugc.edu.co/pages/juridica/documentos/institucionales/Decreto\_Minhacienda\_2650\_93\_PUC\_comerciantes.pdf](https://www.ugc.edu.co/pages/juridica/documentos/institucionales/Decreto_Minhacienda_2650_93_PUC_comerciantes.pdf)