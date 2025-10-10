import React from 'react';
import { ChevronRight, MessageCircle, Shield, Package, Zap, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  wowFactor: string;
  benefits: string[];
  badgeColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, accent, wowFactor, benefits, badgeColor }) => {
  return (
    <div className="card card-hover flex flex-col h-full p-6 transition-all group">
      <div className={`p-3 rounded-lg mb-4 inline-flex w-fit ${accent} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>

      <div className="mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
          <Zap className="h-3 w-3 mr-1" />
          {wowFactor}
        </div>
      </div>

      <ul className="space-y-2 flex-grow">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></div>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
};

const workflows = [
  {
    icon: <MessageCircle className="h-6 w-6 text-primary" />,
    title: "Gestión de Citas Completa",
    description: "Sistema completo para programar, modificar y dar seguimiento a todas las citas de tu clínica veterinaria.",
    accent: "bg-primary/10",
    wowFactor: "Agenda ilimitada con calendario integrado",
    badgeColor: "bg-primary/10 text-primary border border-primary/20",
    benefits: [
      "Calendario visual con todas tus citas",
      "Múltiples estados: programada, confirmada, completada",
      "Asignación de veterinarios y personal",
      "Duración personalizable por cita",
      "Notas y razón de consulta para cada cita"
    ],
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "Historiales Médicos Completos",
    description: "Registro detallado de consultas, tratamientos, vacunas y desparasitaciones de cada mascota.",
    accent: "bg-primary/10",
    wowFactor: "Historial completo de cada paciente",
    badgeColor: "bg-primary/10 text-primary border border-primary/20",
    benefits: [
      "Registro de consultas con diagnóstico y tratamiento",
      "Control de vacunaciones por etapa (cachorro, adulto, senior)",
      "Seguimiento de desparasitaciones internas y externas",
      "Historial de medicamentos y prescripciones",
      "Calendario de próximos tratamientos"
    ],
  },
  {
    icon: <Package className="h-6 w-6 text-primary" />,
    title: "Control de Inventario y Ventas",
    description: "Gestiona tu inventario de medicamentos, productos y registra todas las ventas de tu clínica.",
    accent: "bg-primary/10",
    wowFactor: "Control completo de stock y ventas",
    badgeColor: "bg-primary/10 text-primary border border-primary/20",
    benefits: [
      "Inventario de medicamentos, vacunas y productos",
      "Alertas de stock mínimo y productos por vencer",
      "Registro de ventas con múltiples métodos de pago",
      "Caja registradora con apertura y cierre de turno",
      "Historial de movimientos de inventario"
    ],
  },
];

const additionalFeatures = [
  {
    icon: <Clock className="h-5 w-5 text-primary" />,
    title: "Sistema de Recordatorios",
    description: "Gestiona recordatorios de citas, vacunas y tratamientos para tus clientes",
    accent: "bg-primary/10",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    title: "Gestión de Personal",
    description: "Administra tu equipo de veterinarios y personal con roles y permisos",
    accent: "bg-primary/10",
  },
];

export const FeatureShowcase: React.FC = () => {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Zap className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">Características principales</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Todo lo que necesitas para <span className="text-primary">gestionar tu clínica</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            <strong className="text-foreground">Sistema completo de gestión veterinaria.</strong> Administra citas, historiales, inventario y ventas en una sola plataforma.
          </p>
        </div>

        {/* Main MVP Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {workflows.map((workflow, index) => (
            <FeatureCard
              key={index}
              icon={workflow.icon}
              title={workflow.title}
              description={workflow.description}
              accent={workflow.accent}
              wowFactor={workflow.wowFactor}
              benefits={workflow.benefits}
              badgeColor={workflow.badgeColor}
            />
          ))}
        </div>

        {/* Value Props Section */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Todo en uno</div>
              <p className="text-muted-foreground">Gestión completa de tu clínica</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">Multi-clínica</div>
              <p className="text-muted-foreground">Soporte para múltiples sucursales</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">30 días gratis</div>
              <p className="text-muted-foreground">Prueba sin compromiso</p>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Y mucho más para hacer crecer tu clínica
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="card flex items-start p-6">
              <div className={`p-2 rounded-lg mr-4 ${feature.accent}`}>
                {feature.icon}
              </div>
              <div>
                <h4 className="text-lg font-medium text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="card p-8 shadow-md">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              ¿Listo para organizar tu clínica?
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Comienza con 30 días gratis. Sin tarjeta de crédito.
            </p>
            <Link href="/api/auth/register" className="btn-primary inline-flex items-center px-6 py-3 rounded-xl mr-4">
              Probar 30 días gratis <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/precios" className="btn-secondary inline-flex items-center px-6 py-3 rounded-xl">
              Ver precios
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase; 