# Component Structure: Stride Core Application

**Created**: 2024-12-19  
**Purpose**: Define component hierarchy, props, interfaces, and organization

## Component Organization Strategy

### Package Structure
```
packages/ui/
├── components/
│   ├── atoms/           # Basic building blocks (Button, Input, Badge)
│   ├── molecules/       # Composed components (FormField, Card, Modal)
│   ├── organisms/       # Complex components (KanbanBoard, IssueCard, CommandPalette)
│   └── templates/       # Page layouts (DashboardLayout, ProjectLayout)
├── hooks/               # Shared React hooks
└── utils/               # Component utilities

apps/web/
├── app/                 # Next.js App Router pages
│   ├── (auth)/          # Auth routes
│   ├── (dashboard)/     # Protected dashboard routes
│   └── api/             # API routes
├── components/          # App-specific components
│   ├── features/        # Feature-specific components
│   └── shared/          # App-level shared components
└── lib/                 # App-specific utilities
```

### Design Principles
- **Atomic Design**: Organize by complexity (atoms → molecules → organisms → templates)
- **Feature-Based**: Group related components by feature domain
- **Server Components First**: Default to server components, use client only when needed
- **Composition**: Build complex components from simpler ones
- **Reusability**: Shared components in `packages/ui`, app-specific in `apps/web`

## Component Hierarchy

### Layout Components (Templates)

#### `DashboardLayout`
**Type**: Server Component (with client navigation)  
**Purpose**: Main application layout with sidebar and top bar

**Props**:
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  projectId?: string;
}
```

**Composition**:
- `Sidebar` (client) - Navigation
- `TopBar` (client) - User menu, search, notifications
- `Breadcrumbs` (server) - Navigation path
- `{children}` - Page content

**Location**: `apps/web/components/templates/DashboardLayout.tsx`

---

#### `ProjectLayout`
**Type**: Server Component  
**Purpose**: Project-specific layout with project context

**Props**:
```typescript
interface ProjectLayoutProps {
  children: React.ReactNode;
  projectId: string;
}
```

**Composition**:
- `ProjectHeader` (server) - Project info, settings link
- `ProjectTabs` (client) - View switcher (Board, List, Roadmap)
- `{children}` - Project content

**Location**: `apps/web/components/templates/ProjectLayout.tsx`

---

### Navigation Components (Organisms)

#### `Sidebar`
**Type**: Client Component  
**Purpose**: Main navigation sidebar

**Props**:
```typescript
interface SidebarProps {
  currentPath: string;
  projects: Project[];
  user: User;
}
```

**State**:
- Collapsed state (Jotai atom)
- Active project (Jotai atom)

**Composition**:
- `SidebarItem` (molecule) - Navigation items
- `ProjectSelector` (molecule) - Project switcher
- `UserMenu` (molecule) - User profile menu

**Location**: `packages/ui/components/organisms/Sidebar.tsx`

---

#### `CommandPalette`
**Type**: Client Component  
**Purpose**: Global command palette (Cmd/Ctrl+K)

**Props**:
```typescript
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}
```

**State**:
- Search query (local state)
- Selected command (local state)
- Recent items (Jotai atom)

**Composition**:
- `CommandInput` (molecule) - Search input
- `CommandList` (molecule) - Command results
- `CommandGroup` (molecule) - Grouped commands

**Keyboard Shortcuts**:
- `Cmd/Ctrl+K` - Open/close
- `Arrow Up/Down` - Navigate
- `Enter` - Execute
- `Esc` - Close

**Location**: `packages/ui/components/organisms/CommandPalette.tsx`

---

### Issue Management Components (Organisms)

#### `KanbanBoard`
**Type**: Client Component  
**Purpose**: Drag-and-drop Kanban board

**Props**:
```typescript
interface KanbanBoardProps {
  projectId: string;
  issues: Issue[];
  statuses: WorkflowStatus[];
  onIssueMove: (issueId: string, newStatus: string) => Promise<void>;
}
```

**State**:
- Dragged issue (dnd-kit state)
- Column filters (Jotai atom)
- Issue data (TanStack Query)

**Composition**:
- `KanbanColumn` (molecule) - Status column
- `IssueCard` (molecule) - Issue card
- `EmptyColumn` (molecule) - Empty state

**Features**:
- Drag and drop (dnd-kit)
- Keyboard navigation
- Column filtering
- Issue count badges

**Location**: `packages/ui/components/organisms/KanbanBoard.tsx`

---

#### `IssueCard`
**Type**: Client Component  
**Purpose**: Individual issue card on Kanban board

**Props**:
```typescript
interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}
```

**Composition**:
- `IssueKey` (atom) - Issue identifier
- `IssueTitle` (atom) - Issue title
- `IssueMeta` (molecule) - Assignee, priority, story points
- `IssueLabels` (molecule) - Custom field badges

**Location**: `packages/ui/components/molecules/IssueCard.tsx`

---

#### `IssueDetail`
**Type**: Server Component (with client parts)  
**Purpose**: Full issue detail view

**Props**:
```typescript
interface IssueDetailProps {
  issueKey: string;
  projectId: string;
}
```

**Composition**:
- `IssueHeader` (server) - Title, key, status
- `IssueDescription` (client) - Markdown with Mermaid
- `IssueComments` (client) - Comment thread
- `IssueSidebar` (client) - Assignee, sprint, custom fields
- `IssueActivity` (server) - Activity log

**Location**: `apps/web/components/features/issues/IssueDetail.tsx`

---

#### `IssueForm`
**Type**: Client Component  
**Purpose**: Create/edit issue form

**Props**:
```typescript
interface IssueFormProps {
  projectId: string;
  issue?: Issue;
  onSave: (data: CreateIssueInput) => Promise<void>;
  onCancel: () => void;
}
```

**State**:
- Form state (React Hook Form)
- Validation errors (Zod)
- Custom fields (dynamic based on config)

**Composition**:
- `FormField` (molecule) - Input fields
- `CustomFieldInput` (molecule) - Dynamic custom fields
- `MarkdownEditor` (molecule) - Description editor

**Location**: `apps/web/components/features/issues/IssueForm.tsx`

---

### Configuration Components (Organisms)

#### `ConfigEditor`
**Type**: Client Component  
**Purpose**: YAML configuration editor

**Props**:
```typescript
interface ConfigEditorProps {
  projectId: string;
  initialValue: string;
  onSave: (yaml: string) => Promise<ValidationResult>;
}
```

**State**:
- Editor content (CodeMirror state)
- Validation errors (local state)
- Syntax errors (CodeMirror diagnostics)

**Composition**:
- `CodeMirror` (molecule) - YAML editor
- `ConfigPreview` (molecule) - Live preview
- `ValidationErrors` (molecule) - Error display

**Features**:
- Syntax highlighting
- Real-time validation
- Autocomplete
- Error indicators

**Location**: `apps/web/components/features/config/ConfigEditor.tsx`

---

### Sprint Components (Organisms)

#### `SprintPlanning`
**Type**: Client Component  
**Purpose**: Sprint planning interface

**Props**:
```typescript
interface SprintPlanningProps {
  projectId: string;
  cycleId: string;
}
```

**State**:
- Sprint issues (TanStack Query)
- Backlog issues (TanStack Query)
- Drag state (dnd-kit)

**Composition**:
- `SprintHeader` (molecule) - Sprint info, capacity
- `SprintIssues` (molecule) - Assigned issues
- `Backlog` (molecule) - Available issues

**Location**: `apps/web/components/features/cycles/SprintPlanning.tsx`

---

#### `BurndownChart`
**Type**: Client Component  
**Purpose**: Sprint burndown visualization

**Props**:
```typescript
interface BurndownChartProps {
  cycleId: string;
  data: BurndownDataPoint[];
}
```

**Composition**:
- Chart library (recharts or similar)
- Legend
- Tooltip

**Location**: `packages/ui/components/organisms/BurndownChart.tsx`

---

### Markdown Components (Molecules)

#### `MarkdownRenderer`
**Type**: Client Component  
**Purpose**: Render Markdown with extensions

**Props**:
```typescript
interface MarkdownRendererProps {
  content: string;
  className?: string;
}
```

**Composition**:
- `react-markdown` - Base renderer
- `MermaidDiagram` (molecule) - Diagram renderer
- `LinkPreview` (molecule) - Contextual links

**Features**:
- GitHub Flavored Markdown
- Mermaid diagram support
- Link previews
- Syntax highlighting

**Location**: `packages/ui/components/molecules/MarkdownRenderer.tsx`

---

#### `MermaidDiagram`
**Type**: Client Component  
**Purpose**: Render Mermaid diagrams

**Props**:
```typescript
interface MermaidDiagramProps {
  code: string;
  id: string;
}
```

**State**:
- Rendered SVG (local state)
- Error state (local state)

**Location**: `packages/ui/components/molecules/MermaidDiagram.tsx`

---

### Form Components (Molecules)

#### `FormField`
**Type**: Client Component  
**Purpose**: Reusable form field with validation

**Props**:
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'textarea' | 'select' | 'number';
  required?: boolean;
  error?: string;
  register: UseFormRegister<any>;
}
```

**Composition**:
- `Label` (atom)
- `Input` (atom)
- `ErrorMessage` (atom)

**Location**: `packages/ui/components/molecules/FormField.tsx`

---

### Basic Components (Atoms)

#### `Button`
**Type**: Client Component  
**Purpose**: Button with variants

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
```

**Location**: `packages/ui/components/atoms/Button.tsx`

---

#### `Input`
**Type**: Client Component  
**Purpose**: Text input

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}
```

**Location**: `packages/ui/components/atoms/Input.tsx`

---

#### `Badge`
**Type**: Client Component  
**Purpose**: Status badge

**Props**:
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}
```

**Location**: `packages/ui/components/atoms/Badge.tsx`

---

## Component Props Patterns

### Server Component Props
- Receive data directly from database/API
- No client-side state
- Pass data to client components as props

### Client Component Props
- Receive data from server components or TanStack Query
- Can manage local state
- Use Jotai for global state
- Accept callbacks for user interactions

### Form Props Pattern
```typescript
interface FormProps<T> {
  initialValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  validationSchema: ZodSchema<T>;
}
```

### List Props Pattern
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  error?: Error;
}
```

## Component Communication Patterns

### Parent → Child
- Props (data and callbacks)
- Context (for deeply nested components)

### Child → Parent
- Callback props
- Event handlers

### Sibling Components
- Shared Jotai atoms
- TanStack Query cache
- URL state (searchParams)

### Server → Client
- Server Components pass data as props
- TanStack Query for client-side fetching
- Server Actions for mutations

## Component Organization by Feature

### Issue Management
- `IssueCard`, `IssueDetail`, `IssueForm`, `IssueList`
- Location: `apps/web/components/features/issues/`

### Project Configuration
- `ConfigEditor`, `ConfigPreview`, `ConfigValidation`
- Location: `apps/web/components/features/config/`

### Sprint Planning
- `SprintPlanning`, `BurndownChart`, `SprintSelector`
- Location: `apps/web/components/features/cycles/`

### Authentication
- `LoginForm`, `SignupForm`, `AuthGuard`
- Location: `apps/web/components/features/auth/`

### Integrations
- `GitConnection`, `WebhookSettings`, `LinkPreview`
- Location: `apps/web/components/features/integrations/`

## Component Testing Strategy

### Unit Tests
- Test atoms and molecules in isolation
- Mock dependencies
- Test props and rendering

### Integration Tests
- Test organisms with real data
- Test component interactions
- Test form submissions

### Visual Tests
- Storybook for component documentation
- Visual regression testing
- Accessibility testing

## Performance Considerations

### Code Splitting
- Lazy load heavy components (Mermaid, CodeMirror)
- Dynamic imports for feature components
- Route-based code splitting (Next.js automatic)

### Memoization
- `memo()` for expensive components
- `useMemo()` for computed values
- `useCallback()` for stable callbacks

### Server Components
- Use server components for data fetching
- Minimize client-side JavaScript
- Stream data when possible

## Accessibility

### Keyboard Navigation
- All interactive elements keyboard accessible
- Focus management in modals
- Skip links for navigation

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Live regions for dynamic content

### Visual
- Sufficient color contrast
- Focus indicators
- Error states not color-only

