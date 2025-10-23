import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectInfo from "@/components/system/ProjectInfo";
import DesignSystem from "@/components/system/DesignSystem";

const SystemView = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Información del Sistema</h1>
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información del Proyecto</TabsTrigger>
          <TabsTrigger value="design">Sistema de Diseño</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <ProjectInfo />
        </TabsContent>
        <TabsContent value="design">
          <DesignSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemView;
