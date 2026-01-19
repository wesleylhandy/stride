"use client";

import { useState, useEffect, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { json } from "@codemirror/lang-json";
import { parseYamlConfig, type ValidationError } from "@stride/yaml-config";
import type { ProjectConfig } from "@stride/yaml-config";
import { DocumentationLink } from "../molecules/DocumentationLink";

export interface ConfigEditorProps {
  /** Initial YAML content */
  initialValue?: string;
  /** Callback when configuration is saved */
  onSave?: (configYaml: string, config: ProjectConfig) => Promise<void>;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Project ID for fetching/saving config */
  projectId?: string;
  /** Whether to show config preview */
  showPreview?: boolean;
}

/**
 * Configuration Editor component with YAML syntax highlighting and validation
 */
export function ConfigEditor({
  initialValue = "",
  onSave,
  readOnly = false,
  showPreview = false,
}: ConfigEditorProps) {
  const [yamlContent, setYamlContent] = useState(initialValue);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [parsedConfig, setParsedConfig] = useState<ProjectConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");

  // Real-time validation
  useEffect(() => {
    if (!yamlContent.trim()) {
      setValidationErrors([]);
      setParsedConfig(null);
      return;
    }

    const result = parseYamlConfig(yamlContent);
    setValidationErrors(result.errors || []);
    setParsedConfig(result.data || null);
  }, [yamlContent]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    // Check for validation errors
    if (validationErrors.length > 0) {
      setSaveStatus("error");
      setSaveMessage("Please fix validation errors before saving");
      return;
    }

    if (!parsedConfig) {
      setSaveStatus("error");
      setSaveMessage("Invalid configuration");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      await onSave(yamlContent, parsedConfig);
      setSaveStatus("success");
      setSaveMessage("Configuration saved successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save configuration"
      );
    } finally {
      setIsSaving(false);
    }
  }, [yamlContent, parsedConfig, validationErrors, onSave]);

  const hasErrors = validationErrors.length > 0;
  const isValid = !hasErrors && parsedConfig !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Editor Section */}
      <div className="flex-1 flex flex-col border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Configuration (YAML)
            </h3>
            <DocumentationLink section="reference" className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Help
            </DocumentationLink>
          </div>
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving || hasErrors || !isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          )}
        </div>

        {/* Validation Status */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          {hasErrors ? (
            <div className="text-sm text-red-600 dark:text-red-400">
              {validationErrors.length} validation error
              {validationErrors.length !== 1 ? "s" : ""}
            </div>
          ) : isValid ? (
            <div className="text-sm text-green-600 dark:text-green-400">
              ✓ Configuration is valid
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Enter YAML configuration...
            </div>
          )}
          {saveStatus !== "idle" && (
            <div
              className={`mt-1 text-sm ${
                saveStatus === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>

        {/* CodeMirror Editor */}
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={yamlContent}
            onChange={(value) => setYamlContent(value)}
            extensions={[yaml()]}
            readOnly={readOnly}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: false,
            }}
            theme="dark"
            className="h-full"
          />
        </div>
      </div>

      {/* Error Display */}
      {hasErrors && (
        <div className="mt-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="px-4 py-2 bg-red-100 dark:bg-red-900/40 border-b border-red-300 dark:border-red-700">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              Validation Errors
            </h4>
          </div>
          <div className="px-4 py-2 max-h-48 overflow-auto">
            <ul className="space-y-2 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-700 dark:text-red-300">
                  <div className="font-medium">
                    {error.path.length > 0
                      ? `Path: ${error.path.join(".")}`
                      : "Configuration"}
                    {error.line && ` (Line ${error.line}${error.column ? `, Column ${error.column}` : ""})`}
                  </div>
                  <div className="text-red-600 dark:text-red-400">
                    {error.message}
                  </div>
                  {error.code && (
                    <div className="text-xs text-red-500 dark:text-red-500 mt-1">
                      Code: {error.code}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Config Preview */}
      {showPreview && parsedConfig && !hasErrors && (
        <div className="mt-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Configuration Preview
            </h4>
          </div>
          <div className="h-64 overflow-auto">
            <CodeMirror
              value={JSON.stringify(parsedConfig, null, 2)}
              extensions={[json()]}
              readOnly={true}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
              }}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

