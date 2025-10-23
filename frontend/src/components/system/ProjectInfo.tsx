import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProjectInfo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyecto NexoPOS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Resumen del Proyecto</h3>
          <p className="text-muted-foreground">
            NexoPOS es un sistema de Punto de Venta (POS) full-stack diseñado para el mercado colombiano.
            Ofrece una solución de software como servicio (SaaS) para comerciantes que incluye facturación,
            control de inventario, gestión de clientes y créditos, y reportes, con cumplimiento de la
            normativa DIAN de Colombia.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Stack Tecnológico</h3>
          <p className="text-muted-foreground">
            El proyecto está construido enteramente en TypeScript.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
            <li><strong>Backend:</strong> NestJS con TypeORM, conectado a una base de datos PostgreSQL. Utiliza JWT para la autenticación y expone una API REST documentada con Swagger.</li>
            <li><strong>Frontend:</strong> React (con Vite), utilizando Tailwind CSS y shadcn/ui para la interfaz de usuario, Zustand para el manejo de estado global y React Router para la navegación.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Arquitectura</h3>
          <p className="text-muted-foreground">
            El proyecto sigue una clara separación entre el frontend y el backend, estructurado como un monorepo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInfo;
