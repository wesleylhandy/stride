// UI package exports
// Components will be exported here as they are created
//
// To use Tailwind styles, import the stylesheet:
// import '@stride/ui/styles';

// Atoms
export { Button, type ButtonProps } from './atoms/Button';
export { Input, type InputProps } from './atoms/Input';
export { Badge, type BadgeProps } from './atoms/Badge';

// Molecules
export { MarkdownRenderer, type MarkdownRendererProps } from './molecules/MarkdownRenderer';
export { MermaidDiagram, type MermaidDiagramProps } from './molecules/MermaidDiagram';
export { LinkPreview, type LinkPreviewProps, type LinkPreviewData } from './molecules/LinkPreview';
export { MarkdownEditor, type MarkdownEditorProps } from './molecules/MarkdownEditor';
export { IssueCard, type IssueCardProps } from './molecules/IssueCard';
export { UserMenu, type UserMenuProps } from './molecules/UserMenu';
export { BurndownChart, type BurndownChartProps } from './molecules/BurndownChart';
export { ProjectSelector, type ProjectSelectorProps, type Project } from './molecules/ProjectSelector';
export { Breadcrumbs, type BreadcrumbsProps, type BreadcrumbItem } from './molecules/Breadcrumbs';
export { Modal, type ModalProps } from './molecules/Modal';

// Organisms
export { CommandPalette, type CommandPaletteProps, type Command } from './organisms/CommandPalette';
export { ConfigEditor, type ConfigEditorProps } from './organisms/ConfigEditor';
export { IssueForm, type IssueFormProps } from './organisms/IssueForm';
export { KanbanBoard, type KanbanBoardProps } from './organisms/KanbanBoard';
export { IssueDetail, type IssueDetailProps } from './organisms/IssueDetail';
export { SprintPlanning, type SprintPlanningProps, type CycleMetrics } from './organisms/SprintPlanning';
export { TopBar, type TopBarProps } from './organisms/TopBar';
export { Sidebar, type SidebarProps } from './organisms/Sidebar';
export { ProjectTabs, type ProjectTabsProps, type ProjectTab } from './organisms/ProjectTabs';

// Utils
export { cn } from './utils/cn';

