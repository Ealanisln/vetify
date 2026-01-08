"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Plus,
  Wrench,
  RefreshCw,
  Shield,
  Tag,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import {
  parseChangelog,
  formatDateSpanish,
  getChangelogContent,
  type ChangelogEntry,
} from "@/lib/changelog-parser";

// Category configuration with icons and colors
const categoryConfig = {
  added: {
    icon: Plus,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    label: "Agregado",
  },
  fixed: {
    icon: Wrench,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    label: "Corregido",
  },
  changed: {
    icon: RefreshCw,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    label: "Modificado",
  },
  security: {
    icon: Shield,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    label: "Seguridad",
  },
};

interface VersionSectionProps {
  entry: ChangelogEntry;
  isFirst: boolean;
}

function VersionSection({ entry, isFirst }: VersionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isFirst);

  const categoryOrder = ["added", "fixed", "changed", "security"] as const;
  const hasCategories = categoryOrder.some(
    (cat) => entry.categories[cat]?.length
  );

  if (!hasCategories) return null;

  return (
    <div className="relative pl-8 pb-12 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-0 w-6 h-6 rounded-full border-4 ${
          isFirst
            ? "bg-primary border-primary/30"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        }`}
      />

      {/* Version header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {entry.version === "Unreleased" ? "En desarrollo" : `v${entry.version}`}
            </span>
          </div>
          {entry.date && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDateSpanish(entry.date)}</span>
            </div>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 dark:group-hover:text-gray-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Categories */}
      {isExpanded && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {categoryOrder.map((categoryKey) => {
            const items = entry.categories[categoryKey];
            if (!items?.length) return null;

            const config = categoryConfig[categoryKey];
            const Icon = config.icon;

            return (
              <div key={categoryKey} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <h3 className={`font-medium ${config.color}`}>
                    {config.label}
                  </h3>
                </div>
                <ul className="space-y-2 ml-8">
                  {items.map((item, index) => (
                    <li
                      key={index}
                      className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-2 align-middle" />
                      {item.includes(" | ") ? (
                        <span>
                          {item.split(" | ")[0]}
                          <ul className="mt-1 ml-4 space-y-1 text-gray-600 dark:text-gray-400">
                            {item
                              .split(" | ")
                              .slice(1)
                              .map((subItem, subIndex) => (
                                <li key={subIndex} className="text-xs">
                                  - {subItem}
                                </li>
                              ))}
                          </ul>
                        </span>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ActualizacionesPage() {
  const changelogContent = getChangelogContent();
  const entries = parseChangelog(changelogContent);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Actualizaciones de{" "}
            <span className="text-primary">Vetify</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            Mantente al día con las últimas mejoras, correcciones y nuevas
            funcionalidades de nuestra plataforma.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            {entries.length > 0 ? (
              <div className="space-y-0">
                {entries.map((entry, index) => (
                  <VersionSection
                    key={entry.version}
                    entry={entry}
                    isFirst={index === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No hay actualizaciones disponibles.
                </p>
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Este registro sigue el formato de{" "}
            <a
              href="https://keepachangelog.com/es-ES/1.1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Keep a Changelog
            </a>{" "}
            y adhiere a{" "}
            <a
              href="https://semver.org/lang/es/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Versionado Semántico
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
