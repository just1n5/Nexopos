# 🤖 Contexto del Proyecto: NexoPOS

Este documento proporciona un resumen del proyecto NexoPOS para ser utilizado como contexto en futuras interacciones.

## 📝 Resumen del Proyecto

**NexoPOS** es un sistema de Punto de Venta (POS) full-stack diseñado para el mercado colombiano. El proyecto está estructurado como un monorepo con dos componentes principales: un backend de NestJS y un frontend de React.

-   **Finalidad**: Ofrecer una solución de software como servicio (SaaS) para comerciantes que incluye facturación, control de inventario, gestión de clientes y créditos, y reportes, con cumplimiento de la normativa DIAN de Colombia.
-   **Stack Tecnológico**: El proyecto está construido enteramente en TypeScript.
    -   **Backend**: NestJS con TypeORM, conectado a una base de datos PostgreSQL. Utiliza JWT para la autenticación y expone una API REST documentada con Swagger.
    -   **Frontend**: React (con Vite), utilizando Tailwind CSS y shadcn/ui para la interfaz de usuario, Zustand para el manejo de estado global y React Router para la navegación.

## 🏗️ Arquitectura

El proyecto sigue una clara separación entre el frontend y el backend:

-   `backend/`: Contiene la aplicación de NestJS. Sigue una arquitectura modular (ej. `ProductsModule`, `AuthModule`, `SalesModule`) y se conecta a una base de datos PostgreSQL. La configuración de la base de datos se gestiona a través de variables de entorno y TypeORM.
-   `frontend/`: Contiene la aplicación de React. Utiliza una arquitectura basada en componentes, con vistas cargadas de forma perezosa (`lazy loading`), hooks personalizados (ej. `useAuth`) y servicios para interactuar con la API del backend.
-   `package.json` (raíz): Contiene scripts para gestionar el proyecto completo, como la instalación de dependencias y la ejecución concurrente de ambos servicios.

## 🚀 Comandos Clave

La mayoría de los comandos deben ejecutarse desde el directorio raíz del proyecto.

-   **Instalación Completa**:
    ```bash
    # Instala las dependencias en la raíz, backend y frontend
    npm run install:all
    ```

-   **Ejecución en Desarrollo**:
    ```bash
    # Inicia el backend y el frontend en modo de desarrollo simultáneamente
    npm run dev
    ```
    -   El frontend se ejecutará en `http://localhost:5173`.
    -   El backend se ejecutará en `http://localhost:3000`.
    -   La documentación de la API estará disponible en `http://localhost:3000/api`.

-   **Comandos del Backend** (ejecutar desde el directorio `backend/`):
    -   `npm run start:dev`: Inicia el servidor de desarrollo con recarga automática.
    -   `npm run build`: Compila la aplicación para producción.
    -   `npm run test`: Ejecuta las pruebas unitarias.
    -   `npm run seed`: Puebla la base de datos con datos iniciales.
    -   `npm run migration:run`: Ejecuta las migraciones de la base de datos.

-   **Comandos del Frontend** (ejecutar desde el directorio `frontend/`):
    -   `npm run dev`: Inicia el servidor de desarrollo de Vite.
    -   `npm run build`: Compila la aplicación para producción.
    -   `npm run lint`: Analiza el código en busca de errores de estilo.

## 📋 Convenciones de Desarrollo

-   **Estilo de Código**: El proyecto utiliza ESLint y Prettier para mantener un estilo de código consistente.
-   **Manejo de Estado (Frontend)**: Se utiliza Zustand para un manejo de estado global simple y eficiente.
-   **UI (Frontend)**: La interfaz se construye con `shadcn/ui`, que se basa en componentes de Radix UI y se estila con Tailwind CSS.
-   **Base de Datos**: Las interacciones con la base de datos PostgreSQL se gestionan a través del ORM TypeORM, con un sistema de migraciones para los cambios en el esquema.
-   **API**: El backend provee una API RESTful. Se utilizan DTOs con `class-validator` y `class-transformer` para la validación y transformación de datos en las solicitudes.
