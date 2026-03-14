import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFees, useFinanceSummary, useCreatePayment, useDeleteFee, useCreateFee, useFeeTypes } from "@/hooks/useFees";
import { useTransactions, useCreateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useStudents } from "@/hooks/useStudents";
import { useSearch } from "@/hooks/useSearch";
import { api } from "@/services/api";
import {
  CreditCard,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  GraduationCap,
  Users,
  Building2,
  ChevronLeft,
  Loader2,
  Banknote,
  Search,
  Trash2,
  MoreVertical,
  Printer,
  Download,
  Calendar,
  Receipt as ReceiptIcon,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import type { Fee, Transaction, SearchResult } from "@/types";

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
};

const getMethodLabel = (method: string) => {
  const labels: Record<string, string> = { CASH: 'Efectivo', TRANSFER: 'Transferencia', CHECK: 'Cheque' };
  return labels[method] || method;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: "Pagado", color: "bg-success/10 text-success", icon: CheckCircle2 },
  PARTIAL: { label: "Parcial/Abono", color: "bg-warning/10 text-warning", icon: Clock },
  PENDING: { label: "Pendiente", color: "bg-secondary/10 text-secondary", icon: Clock },
  OVERDUE: { label: "Vencido", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

// --- Wizard types ---
type TransactionType = "INCOME" | "EXPENSE";
type PersonType = "STUDENT" | "TEACHER" | "THIRD_PARTY";
type ConceptOption = "Matricula" | "Mensualidad" | "Nomina" | "Pago Proveedor" | "Otro";
type PaymentMethod = "TRANSFER" | "CASH";

interface WizardData {
  transactionType: TransactionType | null;
  personType: PersonType | null;
  person: { id: number; name: string; detail: string } | null;
  thirdPartyName: string;
  concept: ConceptOption | null;
  customConcept: string;
  paymentMethod: PaymentMethod | null;
  amount: number;
  reference: string;
  notes: string;
  date: string;
  bank: string;
}

const INITIAL_WIZARD_DATA: WizardData = {
  transactionType: null,
  personType: null,
  person: null,
  thirdPartyName: "",
  concept: null,
  customConcept: "",
  paymentMethod: null,
  amount: 0,
  reference: "",
  notes: "",
  date: new Date().toISOString().split("T")[0],
  bank: "",
};

const WIZARD_STEP_LABELS = [
  "Tipo",
  "Persona",
  "Buscar",
  "Concepto",
  "Detalles",
  "Resumen",
];

// --- Step Indicator ---
function StepIndicator({
  currentStep,
  totalSteps,
  onStepClick,
}: {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (isCompleted) onStepClick(stepNum);
            }}
            disabled={!isCompleted}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all
              ${isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2" : ""}
              ${isCompleted ? "bg-success text-white cursor-pointer hover:bg-success/80" : ""}
              ${!isCurrent && !isCompleted ? "bg-muted text-muted-foreground cursor-default" : ""}
            `}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              stepNum
            )}
          </button>
        );
      })}
    </div>
  );
}

// --- Wizard Steps ---
function StepTransactionType({
  onSelect,
}: {
  onSelect: (type: TransactionType) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Tipo de Transaccion</h3>
      <p className="text-sm text-muted-foreground text-center">
        Selecciona si es un ingreso o un egreso
      </p>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card
          className="cursor-pointer hover:border-success hover:shadow-md transition-all group"
          onClick={() => onSelect("INCOME")}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
              <ArrowUpRight className="w-7 h-7 text-success" />
            </div>
            <span className="text-lg font-semibold">Ingreso</span>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-destructive hover:shadow-md transition-all group"
          onClick={() => onSelect("EXPENSE")}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
              <ArrowDownRight className="w-7 h-7 text-destructive" />
            </div>
            <span className="text-lg font-semibold">Egreso</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepPersonType({
  onSelect,
}: {
  onSelect: (type: PersonType) => void;
}) {
  const options: { type: PersonType; label: string; icon: any }[] = [
    { type: "STUDENT", label: "Estudiante", icon: GraduationCap },
    { type: "TEACHER", label: "Profesor", icon: Users },
    { type: "THIRD_PARTY", label: "Tercero", icon: Building2 },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Tipo de Persona</h3>
      <p className="text-sm text-muted-foreground text-center">
        Selecciona el tipo de persona relacionada
      </p>
      <div className="grid grid-cols-3 gap-4 mt-6">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <Card
              key={opt.type}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
              onClick={() => onSelect(opt.type)}
            >
              <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-base font-semibold">{opt.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StepSearchPerson({
  personType,
  onSelect,
  onThirdPartySubmit,
  thirdPartyName,
  onThirdPartyNameChange,
}: {
  personType: PersonType;
  onSelect: (result: SearchResult) => void;
  onThirdPartySubmit: () => void;
  thirdPartyName: string;
  onThirdPartyNameChange: (name: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchType = personType === "STUDENT" ? "STUDENT" : "TEACHER";
  const { data: searchResults, isLoading: searchLoading } = useSearch(
    debouncedQuery,
    searchType
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (personType === "THIRD_PARTY") {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Nombre del Tercero</h3>
        <p className="text-sm text-muted-foreground text-center">
          Ingresa el nombre de la persona o entidad
        </p>
        <div className="mt-6 space-y-4">
          <Input
            placeholder="Nombre completo o razon social"
            value={thirdPartyName}
            onChange={(e) => onThirdPartyNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && thirdPartyName.trim()) {
                onThirdPartySubmit();
              }
            }}
          />
          <Button
            className="w-full"
            disabled={!thirdPartyName.trim()}
            onClick={onThirdPartySubmit}
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  const results = (searchResults as SearchResult[] | undefined) || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Buscar {personType === "STUDENT" ? "Estudiante" : "Profesor"}
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Escribe al menos 2 caracteres para buscar
      </p>
      <div className="mt-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${personType === "STUDENT" ? "estudiante" : "profesor"} por nombre...`}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {debouncedQuery.length >= 2 && (
          <div className="mt-2 border border-border rounded-lg overflow-hidden bg-card shadow-md max-h-64 overflow-y-auto">
            {searchLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Buscando...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 flex items-center gap-3"
                  onClick={() => onSelect(result)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {result.type === "STUDENT" ? (
                      <GraduationCap className="w-4 h-4 text-primary" />
                    ) : (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.detail}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepConcept({
  onSelect,
  customConcept,
  onCustomConceptChange,
  onCustomConceptSubmit,
  personType,
  feeTypes,
}: {
  onSelect: (concept: ConceptOption | string) => void;
  customConcept: string;
  onCustomConceptChange: (value: string) => void;
  onCustomConceptSubmit: () => void;
  personType?: PersonType | null;
  feeTypes?: { id: number; name: string }[];
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  // For students: show fee types + Nómina, Pago Proveedor, Otro
  // For others: show generic concepts
  const isStudent = personType === "STUDENT";

  const baseConcepts: { value: string; label: string }[] = isStudent
    ? [
        ...(feeTypes || []).map((ft) => ({ value: ft.name, label: ft.name })),
        { value: "Otro", label: "Otro" },
      ]
    : [
        { value: "Matricula", label: "Matricula" },
        { value: "Mensualidad", label: "Mensualidad" },
        { value: "Nomina", label: "Nomina" },
        { value: "Pago Proveedor", label: "Pago Proveedor" },
        { value: "Otro", label: "Otro" },
      ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Concepto</h3>
      <p className="text-sm text-muted-foreground text-center">
        Selecciona la categoria de esta transaccion
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 max-h-[45vh] overflow-y-auto">
        {baseConcepts.map((c) => (
          <Card
            key={c.value}
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => {
              if (c.value === "Otro") {
                setShowCustomInput(true);
              } else {
                onSelect(c.value as ConceptOption);
              }
            }}
          >
            <CardContent className="flex items-center justify-center py-4">
              <span className="text-sm font-semibold text-center">{c.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {showCustomInput && (
        <div className="mt-4 space-y-3">
          <Input
            placeholder="Escribe el concepto personalizado"
            value={customConcept}
            onChange={(e) => onCustomConceptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customConcept.trim()) {
                onCustomConceptSubmit();
              }
            }}
            autoFocus
          />
          <Button
            className="w-full"
            disabled={!customConcept.trim()}
            onClick={onCustomConceptSubmit}
          >
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}

function StepPaymentDetails({
  data,
  onChange,
  onContinue,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onContinue: () => void;
}) {
  const isValid = data.paymentMethod && data.amount >= 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Detalles de Pago</h3>
      <p className="text-sm text-muted-foreground text-center">
        Completa la informacion del pago
      </p>

      <div className="mt-6 space-y-5">
        {/* Payment method */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Metodo de Pago *</label>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`cursor-pointer transition-all group ${
                data.paymentMethod === "TRANSFER"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:border-primary hover:shadow-md"
              }`}
              onClick={() => onChange({ paymentMethod: "TRANSFER" })}
            >
              <CardContent className="flex flex-col items-center justify-center py-5 gap-2">
                <CreditCard className={`w-6 h-6 ${
                  data.paymentMethod === "TRANSFER" ? "text-primary" : "text-muted-foreground"
                }`} />
                <span className="text-sm font-medium">Transferencia</span>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all group ${
                data.paymentMethod === "CASH"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:border-primary hover:shadow-md"
              }`}
              onClick={() => onChange({ paymentMethod: "CASH" })}
            >
              <CardContent className="flex flex-col items-center justify-center py-5 gap-2">
                <Banknote className={`w-6 h-6 ${
                  data.paymentMethod === "CASH" ? "text-primary" : "text-muted-foreground"
                }`} />
                <span className="text-sm font-medium">Efectivo</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bank (only for transfer) */}
        {data.paymentMethod === "TRANSFER" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Banco</label>
            <Input
              placeholder="Ej: Bancolombia, Davivienda..."
              value={data.bank}
              onChange={(e) => onChange({ bank: e.target.value })}
            />
          </div>
        )}

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Monto *</label>
          <Input
            type="number"
            placeholder="0"
            min="0"
            value={data.amount || ""}
            onChange={(e) => onChange({ amount: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">Puedes usar $0 para registrar becas o subsidios</p>
        </div>

        {/* Reference */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Referencia</label>
          <Input
            placeholder="Numero de referencia (opcional)"
            value={data.reference}
            onChange={(e) => onChange({ reference: e.target.value })}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notas</label>
          <Textarea
            placeholder="Notas adicionales (opcional)"
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha</label>
          <Input
            type="date"
            value={data.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>

        <Button className="w-full" disabled={!isValid} onClick={onContinue}>
          Continuar al Resumen
        </Button>
      </div>
    </div>
  );
}

function StepSummary({
  data,
  onConfirm,
  isLoading,
}: {
  data: WizardData;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const personName =
    data.personType === "THIRD_PARTY"
      ? data.thirdPartyName
      : data.person?.name || "-";

  const personTypeLabel =
    data.personType === "STUDENT"
      ? "Estudiante"
      : data.personType === "TEACHER"
        ? "Profesor"
        : "Tercero";

  const conceptLabel =
    data.concept === "Otro" ? data.customConcept : data.concept || "-";

  const methodLabel =
    data.paymentMethod === "TRANSFER" ? "Transferencia" : "Efectivo";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Resumen y Confirmacion</h3>
      <p className="text-sm text-muted-foreground text-center">
        Verifica los datos antes de confirmar
      </p>

      <div className="mt-6 bg-muted/30 rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <Badge
            className={
              data.transactionType === "INCOME"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }
          >
            {data.transactionType === "INCOME" ? "Ingreso" : "Egreso"}
          </Badge>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Persona</span>
          <div className="text-right">
            <p className="text-sm font-medium">{personName}</p>
            <p className="text-xs text-muted-foreground">{personTypeLabel}</p>
          </div>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Concepto</span>
          <span className="text-sm font-medium">{conceptLabel}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Metodo</span>
          <span className="text-sm font-medium">{methodLabel}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Monto</span>
          <span
            className={`text-lg font-bold font-mono ${
              data.transactionType === "INCOME" ? "text-success" : "text-destructive"
            }`}
          >
            {formatCurrency(data.amount)}
          </span>
        </div>

        {data.bank && (
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Banco</span>
            <span className="text-sm font-medium">{data.bank}</span>
          </div>
        )}

        {data.reference && (
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Referencia</span>
            <span className="text-sm font-medium">{data.reference}</span>
          </div>
        )}

        {data.notes && (
          <div className="flex justify-between items-start py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Notas</span>
            <span className="text-sm font-medium text-right max-w-[60%]">
              {data.notes}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Fecha</span>
          <span className="text-sm font-medium">
            {new Date(data.date + "T12:00:00").toLocaleDateString("es-CO")}
          </span>
        </div>
      </div>

      <Button
        className="w-full bg-primary hover:bg-primary/90 mt-4"
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Registrando...
          </>
        ) : (
          "Confirmar Transaccion"
        )}
      </Button>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function Finanzas() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { selectedOrgId } = useOrganization();
  const { user } = useAuth();
  const canDeleteFees = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  // Fee payment state
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: "CASH",
    reference: "",
  });

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({ ...INITIAL_WIZARD_DATA });

  // Filter state
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>("");
  const [feeSearch, setFeeSearch] = useState<string>("");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("");
  const [txFromDate, setTxFromDate] = useState<string>("");
  const [txToDate, setTxToDate] = useState<string>("");

  // Receipt dialog state
  const [receiptDialog, setReceiptDialog] = useState<any>(null);
  const [receiptFee, setReceiptFee] = useState<any>(null);

  // Delete transaction state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Delete fee state
  const [deleteFeeDialogOpen, setDeleteFeeDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<Fee | null>(null);

  // Create fee state
  const [createFeeDialogOpen, setCreateFeeDialogOpen] = useState(false);
  const [newFeeForm, setNewFeeForm] = useState({
    studentId: "",
    feeTypeId: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    markAsPaid: true,
    paymentMethod: "CASH" as "CASH" | "TRANSFER",
    reference: "",
    customDescription: "",
  });
  const [customDescSuggestions, setCustomDescSuggestions] = useState<string[]>([]);
  const [showCustomDescDropdown, setShowCustomDescDropdown] = useState(false);
  const customDescRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary(selectedOrgId || undefined);
  const { data: feesData, isLoading: feesLoading } = useFees({
    status: feeStatusFilter || undefined,
    organizationId: selectedOrgId || undefined,
    search: feeSearch || undefined,
  });
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({
    type: txTypeFilter || undefined,
    from: txFromDate || undefined,
    to: txToDate || undefined,
  });

  const createPayment = useCreatePayment();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const deleteFee = useDeleteFee();
  const createFee = useCreateFee();

  const fees = feesData?.fees || [];
  const transactions = transactionsData?.transactions || [];

  // Additional queries for create fee dialog
  const [studentSearch, setStudentSearch] = useState("");
  const { data: studentsData } = useStudents({ search: studentSearch || undefined, limit: 10 });
  const { data: feeTypes } = useFeeTypes();
  const students = studentsData?.students || [];
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentSearchRef = useRef<HTMLDivElement>(null);

  // Detect existing pending fee of the same type for this student
  const existingPendingFee = (() => {
    if (!selectedStudent || !newFeeForm.feeTypeId) return null;
    const existingFees = selectedStudent.fees || [];
    return existingFees.find((f: any) =>
      String(f.feeTypeId) === newFeeForm.feeTypeId &&
      (f.status === 'PENDING' || f.status === 'PARTIAL' || f.status === 'OVERDUE')
    ) || null;
  })();

  // Detect if selected fee type is "Otro / Misceláneos"
  const isOtroMiscelaneo = (() => {
    if (!newFeeForm.feeTypeId || !feeTypes) return false;
    const selected = feeTypes.find((t: any) => String(t.id) === newFeeForm.feeTypeId);
    return selected?.name?.toLowerCase().includes("otro") || selected?.name?.toLowerCase().includes("miscel");
  })();

  // Auto-suggest amount based on student's existing fees
  const suggestedAmount = (() => {
    if (!selectedStudent || !newFeeForm.feeTypeId) return null;
    const existingFees = selectedStudent.fees || [];
    const matchingFee = existingFees.find((f: any) => String(f.feeTypeId) === newFeeForm.feeTypeId);
    return matchingFee ? matchingFee.amount : null;
  })();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(e.target as Node)) {
        setShowStudentDropdown(false);
      }
      if (customDescRef.current && !customDescRef.current.contains(e.target as Node)) {
        setShowCustomDescDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load custom description suggestions from previous transactions
  useEffect(() => {
    if (isOtroMiscelaneo) {
      const loadSuggestions = async () => {
        try {
          const res = await api.get("/transactions?limit=200");
          const txs = res.data?.transactions || [];
          const descriptions = txs
            .map((t: any) => t.description || "")
            .filter((d: string) => d.includes("Otro") || d.includes("Miscel"))
            .map((d: string) => d.replace(/^(Pago|Abono) de /, "").replace(/ - .*$/, ""))
            .filter((d: string, i: number, arr: string[]) => arr.indexOf(d) === i && d.trim());
          setCustomDescSuggestions(descriptions);
        } catch {
          setCustomDescSuggestions([]);
        }
      };
      loadSuggestions();
    }
  }, [isOtroMiscelaneo]);

  // --- Fee payment handlers ---
  const openPaymentDialog = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentForm({
      amount: fee.balance || fee.amount,
      method: "CASH",
      reference: "",
    });
    setPaymentDialog(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedFee || !paymentForm.amount) {
      toast({ title: "Error", description: "El monto es requerido", variant: "destructive" });
      return;
    }
    try {
      await createPayment.mutateAsync({
        feeId: selectedFee.id,
        studentId: selectedFee.studentId,
        amount: paymentForm.amount,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
      });
      toast({ title: "Registrado", description: "El pago ha sido registrado exitosamente" });
      setPaymentDialog(false);
      setSelectedFee(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // --- Wizard handlers ---
  const openWizard = () => {
    setWizardData({ ...INITIAL_WIZARD_DATA });
    setWizardStep(1);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setWizardData({ ...INITIAL_WIZARD_DATA });
  };

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  const goBack = () => {
    if (wizardStep > 1) setWizardStep((s) => s - 1);
  };

  const handleConfirmTransaction = async () => {
    const personName =
      wizardData.personType === "THIRD_PARTY"
        ? wizardData.thirdPartyName
        : wizardData.person?.name || "";

    const conceptLabel =
      wizardData.concept === "Otro" ? wizardData.customConcept : wizardData.concept || "";

    const description = `${conceptLabel} - ${personName}`.trim();
    const methodLabel =
      wizardData.paymentMethod === "TRANSFER" ? "Transferencia" : "Efectivo";
    const notesText = [
      wizardData.notes,
      wizardData.reference ? `Ref: ${wizardData.reference}` : "",
      `Metodo: ${methodLabel}`,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      await createTransaction.mutateAsync({
        type: wizardData.transactionType!,
        description: description || conceptLabel,
        amount: wizardData.amount,
        category: conceptLabel,
        date: wizardData.date,
        status: "completed",
        notes: notesText || undefined,
        reference: wizardData.reference || undefined,
        personName: personName || undefined,
        personType: wizardData.personType || undefined,
        paymentMethod: wizardData.paymentMethod || undefined,
        bank: wizardData.bank || undefined,
        organizationId: selectedOrgId,
      });
      toast({
        title: "Registrado",
        description: "La transaccion ha sido registrada exitosamente",
      });
      closeWizard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction.mutateAsync(transactionToDelete.id);
      toast({
        title: "Eliminado",
        description: "La transaccion ha sido eliminada exitosamente",
      });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteFee = async () => {
    if (!feeToDelete) return;
    try {
      await deleteFee.mutateAsync(feeToDelete.id);
      toast({
        title: "Eliminado",
        description: "La cuota ha sido eliminada exitosamente",
      });
      setDeleteFeeDialogOpen(false);
      setFeeToDelete(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateFee = async () => {
    if (!newFeeForm.studentId || !newFeeForm.amount) {
      toast({ title: "Error", description: "Todos los campos son requeridos", variant: "destructive" });
      return;
    }

    if (isOtroMiscelaneo && !newFeeForm.customDescription.trim()) {
      toast({ title: "Error", description: "Escribe la descripción del concepto", variant: "destructive" });
      return;
    }

    try {
      if (existingPendingFee) {
        // Pay against existing fee instead of creating a new one
        await createPayment.mutateAsync({
          feeId: existingPendingFee.id,
          studentId: parseInt(newFeeForm.studentId),
          amount: parseFloat(newFeeForm.amount),
          method: newFeeForm.paymentMethod,
          reference: newFeeForm.reference || undefined,
        });
        toast({ title: "Pago registrado", description: "El abono se registró en la cuota existente" });
      } else if (newFeeForm.feeTypeId) {
        // Create new fee
        const feeData: any = {
          studentId: parseInt(newFeeForm.studentId),
          feeTypeId: parseInt(newFeeForm.feeTypeId),
          amount: parseFloat(newFeeForm.amount),
          dueDate: newFeeForm.dueDate,
        };
        if (isOtroMiscelaneo && newFeeForm.customDescription.trim()) {
          feeData.description = newFeeForm.customDescription.trim();
        }
        const fee = await createFee.mutateAsync(feeData);

        if (newFeeForm.markAsPaid) {
          await createPayment.mutateAsync({
            feeId: fee.id,
            studentId: parseInt(newFeeForm.studentId),
            amount: parseFloat(newFeeForm.amount),
            method: newFeeForm.paymentMethod,
            reference: newFeeForm.reference || undefined,
          });
          toast({ title: "Registrado", description: "Cuota creada y pago registrado exitosamente" });
        } else {
          toast({ title: "Creado", description: "La cuota ha sido creada exitosamente" });
        }
      } else {
        toast({ title: "Error", description: "Selecciona un tipo de cuota", variant: "destructive" });
        return;
      }

      setCreateFeeDialogOpen(false);
      setSelectedStudent(null);
      setStudentSearch("");
      setNewFeeForm({
        studentId: "",
        feeTypeId: "",
        amount: "",
        dueDate: new Date().toISOString().split("T")[0],
        markAsPaid: true,
        paymentMethod: "CASH",
        reference: "",
        customDescription: "",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // --- Render wizard step content ---
  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <StepTransactionType
            onSelect={(type) => {
              updateWizardData({ transactionType: type });
              setWizardStep(2);
            }}
          />
        );
      case 2:
        return (
          <StepPersonType
            onSelect={(type) => {
              updateWizardData({ personType: type });
              setWizardStep(3);
            }}
          />
        );
      case 3:
        return (
          <StepSearchPerson
            personType={wizardData.personType!}
            thirdPartyName={wizardData.thirdPartyName}
            onThirdPartyNameChange={(name) => updateWizardData({ thirdPartyName: name })}
            onThirdPartySubmit={() => setWizardStep(4)}
            onSelect={(result) => {
              updateWizardData({
                person: { id: result.id, name: result.name, detail: result.detail },
              });
              setWizardStep(4);
            }}
          />
        );
      case 4:
        return (
          <StepConcept
            customConcept={wizardData.customConcept}
            onCustomConceptChange={(val) => updateWizardData({ customConcept: val })}
            onCustomConceptSubmit={() => {
              updateWizardData({ concept: "Otro" });
              setWizardStep(5);
            }}
            onSelect={(concept) => {
              updateWizardData({ concept: concept as ConceptOption });
              setWizardStep(5);
            }}
            personType={wizardData.personType}
            feeTypes={feeTypes || []}
          />
        );
      case 5:
        return (
          <StepPaymentDetails
            data={wizardData}
            onChange={updateWizardData}
            onContinue={() => setWizardStep(6)}
          />
        );
      case 6:
        return (
          <StepSummary
            data={wizardData}
            onConfirm={handleConfirmTransaction}
            isLoading={createTransaction.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Finanzas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion de cuotas, ingresos y egresos del colegio
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          ) : (
            <>
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {formatCurrency(summary?.monthlyIncome || 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <span className="text-success font-medium">
                    {summary?.incomeGrowth ? `+${summary.incomeGrowth.toFixed(1)}%` : "0%"}
                  </span>
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Egresos del Mes</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {formatCurrency(summary?.monthlyExpense || 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cuotas Pendientes</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {formatCurrency(summary?.pendingFees || 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                </div>
              </div>

              <div className="stat-card-gradient bg-gradient-orange">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">Cuotas Vencidas</p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">
                      {formatCurrency(summary?.overdueFees || 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="fees" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="fees">Estado de Cuotas</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          </TabsList>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar estudiante..."
                      value={feeSearch}
                      onChange={(e) => setFeeSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={feeStatusFilter || "all"}
                    onValueChange={(val) => setFeeStatusFilter(val === "all" ? "" : val)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PAID">Pagado</SelectItem>
                      <SelectItem value="PARTIAL">Parcial/Abono</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="OVERDUE">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setCreateFeeDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cuota
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Estudiante</TableHead>
                    <TableHead className="font-semibold">Programa</TableHead>
                    <TableHead className="font-semibold">Concepto</TableHead>
                    <TableHead className="font-semibold text-right">Monto</TableHead>
                    <TableHead className="font-semibold text-right">Pagado</TableHead>
                    <TableHead className="font-semibold text-right">Pendiente</TableHead>
                    <TableHead className="font-semibold text-center">Vencimiento</TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : fees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay cuotas registradas</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fees.map((fee: Fee, index: number) => {
                      const config = statusConfig[fee.status] || statusConfig.PENDING;
                      const StatusIcon = config.icon;
                      const totalPaid = fee.totalPaid || 0;
                      const balance = fee.balance ?? (fee.amount - totalPaid);
                      return (
                        <TableRow
                          key={fee.id}
                          className={`table-row-hover ${index % 2 === 0 ? "" : "bg-muted/30"}`}
                        >
                          <TableCell className="font-medium">
                            {fee.student?.id ? (
                              <button
                                className="text-left text-primary hover:underline cursor-pointer"
                                onClick={() => navigate(`/estudiantes/${fee.student.id}`)}
                              >
                                {fee.student.name} {(fee.student as any).lastName || ""}
                              </button>
                            ) : (
                              fee.student?.name || "-"
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {fee.student?.class?.name || "-"} {fee.student?.section?.name || ""}
                          </TableCell>
                          <TableCell>
                            {(fee as any).description ? (
                              <>
                                <span className="font-medium text-sm">{(fee as any).description}</span>
                                <span className="block text-xs text-muted-foreground">{fee.feeType?.name}</span>
                              </>
                            ) : (
                              <Badge variant="secondary" className="bg-muted">
                                {fee.feeType?.name || "-"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(fee.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-success">
                            {formatCurrency(totalPaid)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-destructive">
                            {formatCurrency(balance)}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {new Date(fee.dueDate).toLocaleDateString("es-CO")}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Badge className={config.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {fee.status !== "PAID" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPaymentDialog(fee)}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Registrar Pago
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {fee.payments?.some((p: any) => p.receipt) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const lastPayment = fee.payments[fee.payments.length - 1];
                                      const receipt = lastPayment?.receipt;
                                      if (receipt) {
                                        setReceiptFee(fee);
                                        setReceiptDialog({ ...receipt, payment: lastPayment });
                                      }
                                    }}
                                  >
                                    <ReceiptIcon className="w-4 h-4 mr-2" />
                                    Ver Recibo
                                  </DropdownMenuItem>
                                )}
                                {canDeleteFees && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setFeeToDelete(fee);
                                      setDeleteFeeDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-[160px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                  <Select
                    value={txTypeFilter || "all"}
                    onValueChange={(val) => setTxTypeFilter(val === "all" ? "" : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="INCOME">Ingresos</SelectItem>
                      <SelectItem value="EXPENSE">Egresos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-[170px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde</label>
                  <Input
                    type="date"
                    value={txFromDate}
                    onChange={(e) => setTxFromDate(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-[170px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta</label>
                  <Input
                    type="date"
                    value={txToDate}
                    onChange={(e) => setTxToDate(e.target.value)}
                  />
                </div>
                {(txTypeFilter || txFromDate || txToDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setTxTypeFilter(""); setTxFromDate(""); setTxToDate(""); }}
                  >
                    Limpiar filtros
                  </Button>
                )}
                <div className="flex-1" />
                <Button className="bg-primary hover:bg-primary/90" onClick={openWizard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Transaccion
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Descripcion</TableHead>
                    <TableHead className="font-semibold text-right">Monto</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay transacciones registradas</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx: Transaction, index: number) => (
                      <TableRow
                        key={tx.id}
                        className={`table-row-hover ${index % 2 === 0 ? "" : "bg-muted/30"}`}
                      >
                        <TableCell>
                          <Badge className={
                            tx.type === "INCOME"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }>
                            {tx.type === "INCOME" ? "Ingreso" : "Egreso"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell className={`text-right font-mono font-medium ${
                          tx.type === "INCOME" ? "text-success" : "text-destructive"
                        }`}>
                          {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-medium">
                            {tx.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Badge className={
                              tx.status === "completed" || tx.status === "COMPLETED"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }>
                              {tx.status === "completed" || tx.status === "COMPLETED" ? "Completado" : "Pendiente"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {tx.type === "INCOME" && (tx.description?.includes("Pago de") || tx.description?.includes("Abono de")) && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      // Search for receipt matching this transaction
                                      const res = await api.get<any>(`/receipts?limit=200`);
                                      const receipts = res.receipts || [];
                                      const match = receipts.find((r: any) =>
                                        r.amount === tx.amount &&
                                        new Date(r.date).toDateString() === new Date(tx.date).toDateString()
                                      );
                                      if (match) {
                                        // Fetch full receipt with student data
                                        const fullReceipt = await api.get<any>(`/receipts/${match.id}`);
                                        setReceiptFee({ student: fullReceipt.student });
                                        setReceiptDialog({ ...fullReceipt, payment: fullReceipt.payment });
                                      } else {
                                        toast({ title: "Recibo no encontrado", description: "No se encontró un recibo asociado a esta transacción", variant: "destructive" });
                                      }
                                    } catch {
                                      toast({ title: "Error", description: "No se pudo cargar el recibo", variant: "destructive" });
                                    }
                                  }}
                                >
                                  <ReceiptIcon className="w-4 h-4 mr-2" />
                                  Ver Recibo
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setTransactionToDelete(tx);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
              <DialogDescription>
                {selectedFee?.student?.name && (
                  <span>Pago para: {selectedFee.student.name}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedFee && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto total:</span>
                    <span className="font-mono font-medium">{formatCurrency(selectedFee.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagado:</span>
                    <span className="font-mono text-success">{formatCurrency(selectedFee.totalPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="text-muted-foreground font-medium">Saldo:</span>
                    <span className="font-mono font-medium text-destructive">
                      {formatCurrency(selectedFee.balance ?? (selectedFee.amount - (selectedFee.totalPaid || 0)))}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto a Pagar *</label>
                <Input
                  type="number"
                  value={paymentForm.amount || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Metodo de Pago *</label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(val) => setPaymentForm({ ...paymentForm, method: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Referencia</label>
                <Input
                  placeholder="Numero de referencia (opcional)"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreatePayment} disabled={createPayment.isPending}>
                {createPayment.isPending ? "Registrando..." : "Registrar Pago"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Wizard Sheet */}
        <Sheet open={wizardOpen} onOpenChange={(open) => { if (!open) closeWizard(); }}>
          <SheetContent
            side="bottom"
            className="h-[90vh] sm:h-[85vh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader className="pb-2">
              <SheetTitle>Nueva Transaccion</SheetTitle>
              <SheetDescription>
                {WIZARD_STEP_LABELS[wizardStep - 1]} - Paso {wizardStep} de {WIZARD_STEP_LABELS.length}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4">
              <StepIndicator
                currentStep={wizardStep}
                totalSteps={WIZARD_STEP_LABELS.length}
                onStepClick={(step) => setWizardStep(step)}
              />

              {wizardStep > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                  onClick={goBack}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Atras
                </Button>
              )}

              <div className="max-w-lg mx-auto pb-8">
                {renderWizardStep()}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Transaction AlertDialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar transaccion?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer.
                {transactionToDelete && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm">
                    <p className="font-medium">{transactionToDelete.description}</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(transactionToDelete.amount)} - {transactionToDelete.category}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDeleteTransaction}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Fee AlertDialog */}
        <AlertDialog open={deleteFeeDialogOpen} onOpenChange={setDeleteFeeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cuota?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer.
                {feeToDelete && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm">
                    <p className="font-medium">{feeToDelete.student?.name}</p>
                    <p className="text-muted-foreground">
                      {feeToDelete.feeType?.name}: {formatCurrency(feeToDelete.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vence: {new Date(feeToDelete.dueDate).toLocaleDateString("es-CO")}
                    </p>
                    {feeToDelete.payments && feeToDelete.payments.length > 0 && (
                      <p className="text-xs text-destructive font-medium mt-2">
                        Se eliminarán también {feeToDelete.payments.length} pago(s) y sus recibos asociados.
                      </p>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDeleteFee}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Fee Dialog */}
        <Dialog open={createFeeDialogOpen} onOpenChange={(open) => {
          setCreateFeeDialogOpen(open);
          if (!open) {
            setSelectedStudent(null);
            setStudentSearch("");
            setNewFeeForm({ studentId: "", feeTypeId: "", amount: "", dueDate: new Date().toISOString().split("T")[0], markAsPaid: true, paymentMethod: "CASH", reference: "", customDescription: "" });
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{existingPendingFee ? "Registrar Pago" : "Nueva Cuota"}</DialogTitle>
              <DialogDescription>
                {existingPendingFee
                  ? "Registra un abono a la cuota pendiente del estudiante"
                  : "Crea una nueva cuota o registra un pago"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Student Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Estudiante *</label>
                <div className="relative" ref={studentSearchRef}>
                  {selectedStudent ? (
                    <div className="flex items-center justify-between border rounded-md p-2 bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{selectedStudent.name} {selectedStudent.lastName}</p>
                        <p className="text-xs text-muted-foreground">{selectedStudent.admissionNo} - {selectedStudent.class?.name}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedStudent(null);
                        setNewFeeForm({ ...newFeeForm, studentId: "" });
                        setStudentSearch("");
                      }}>
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre, apellido o documento..."
                          value={studentSearch}
                          onChange={(e) => {
                            setStudentSearch(e.target.value);
                            setShowStudentDropdown(true);
                          }}
                          onFocus={() => setShowStudentDropdown(true)}
                          className="pl-9"
                        />
                      </div>
                      {showStudentDropdown && studentSearch.length >= 2 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {students.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground text-center">No se encontraron estudiantes</p>
                          ) : (
                            students.map((s) => (
                              <button
                                key={s.id}
                                className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-0"
                                onClick={async () => {
                                  // Fetch full student with fees for amount suggestion
                                  try {
                                    const fullStudent = await api.get<any>(`/students/${s.id}`);
                                    setSelectedStudent(fullStudent);
                                  } catch {
                                    setSelectedStudent(s);
                                  }
                                  setNewFeeForm({ ...newFeeForm, studentId: String(s.id) });
                                  setShowStudentDropdown(false);
                                  setStudentSearch("");
                                }}
                              >
                                <p className="font-medium">{s.name} {s.lastName}</p>
                                <p className="text-xs text-muted-foreground">{s.admissionNo} - {s.class?.name}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Cuota *</label>
                <Select
                  value={newFeeForm.feeTypeId}
                  onValueChange={(val) => {
                    // Check if selected type is "Otro / Misceláneos"
                    const selectedType = feeTypes?.find((t: any) => String(t.id) === val);
                    const isOtro = selectedType?.name?.toLowerCase().includes("otro") || selectedType?.name?.toLowerCase().includes("miscel");

                    if (isOtro) {
                      // Don't auto-suggest amount for miscellaneous, reset amount and description
                      setNewFeeForm({ ...newFeeForm, feeTypeId: val, amount: "", customDescription: "" });
                    } else {
                      // Auto-suggest amount from student's existing fees
                      setNewFeeForm({ ...newFeeForm, feeTypeId: val, customDescription: "" });
                      if (selectedStudent) {
                        const existingFee = (selectedStudent as any).fees?.find((f: any) => String(f.feeTypeId) === val);
                        if (existingFee) {
                          setNewFeeForm((prev) => ({ ...prev, feeTypeId: val, amount: String(existingFee.amount) }));
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes?.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom description for "Otro / Misceláneos" */}
              {isOtroMiscelaneo && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción del concepto *</label>
                  <div className="relative" ref={customDescRef}>
                    <Input
                      placeholder="Ej: Supletorio + Mensualidad, Camiseta, etc."
                      value={newFeeForm.customDescription}
                      onChange={(e) => {
                        setNewFeeForm({ ...newFeeForm, customDescription: e.target.value });
                        setShowCustomDescDropdown(true);
                      }}
                      onFocus={() => setShowCustomDescDropdown(true)}
                    />
                    {showCustomDescDropdown && customDescSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {customDescSuggestions
                          .filter((s) =>
                            !newFeeForm.customDescription ||
                            s.toLowerCase().includes(newFeeForm.customDescription.toLowerCase())
                          )
                          .map((suggestion, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                              onClick={() => {
                                setNewFeeForm({ ...newFeeForm, customDescription: suggestion });
                                setShowCustomDescDropdown(false);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Escribe el detalle del pago misceláneo
                  </p>
                </div>
              )}

              {/* Existing fee detected - show payment mode */}
              {existingPendingFee && (
                <div className="border rounded-lg p-3 bg-success/5 border-success/30 space-y-2">
                  <p className="text-sm font-medium text-success">
                    Cuota existente detectada
                  </p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Monto total:</span>
                      <span className="font-mono font-medium">{formatCurrency(existingPendingFee.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagado:</span>
                      <span className="font-mono text-success">{formatCurrency(existingPendingFee.totalPaid || existingPendingFee.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-medium">Saldo pendiente:</span>
                      <span className="font-mono font-medium text-destructive">
                        {formatCurrency(existingPendingFee.balance ?? (existingPendingFee.amount - (existingPendingFee.totalPaid || existingPendingFee.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)))}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El pago se registrará como abono a esta cuota existente
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {existingPendingFee ? "Monto a abonar *" : "Monto *"}
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newFeeForm.amount}
                  onChange={(e) => setNewFeeForm({ ...newFeeForm, amount: e.target.value })}
                />
                {suggestedAmount && !existingPendingFee && String(suggestedAmount) !== newFeeForm.amount && (
                  <p className="text-xs text-muted-foreground">
                    Monto habitual: <button
                      className="text-primary font-mono font-semibold underline"
                      onClick={() => setNewFeeForm({ ...newFeeForm, amount: String(suggestedAmount) })}
                    >
                      ${suggestedAmount.toLocaleString("es-CO")}
                    </button>
                  </p>
                )}
              </div>

              {/* Payment details - shown when paying existing fee OR when markAsPaid on new fee */}
              {existingPendingFee ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Método de pago</label>
                    <Select
                      value={newFeeForm.paymentMethod}
                      onValueChange={(val: "CASH" | "TRANSFER") => setNewFeeForm({ ...newFeeForm, paymentMethod: val })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Referencia (opcional)</label>
                    <Input
                      placeholder="No. de recibo o transferencia"
                      value={newFeeForm.reference}
                      onChange={(e) => setNewFeeForm({ ...newFeeForm, reference: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de Vencimiento *</label>
                    <Input
                      type="date"
                      value={newFeeForm.dueDate}
                      onChange={(e) => setNewFeeForm({ ...newFeeForm, dueDate: e.target.value })}
                    />
                  </div>

                  <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFeeForm.markAsPaid}
                        onChange={(e) => setNewFeeForm({ ...newFeeForm, markAsPaid: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Registrar como pagado</span>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {newFeeForm.markAsPaid
                        ? "Se creará la cuota y se registrará el pago automáticamente (aparecerá en ingresos)"
                        : "Solo se creará la obligación de pago (deuda pendiente)"}
                    </p>

                    {newFeeForm.markAsPaid && (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Método de pago</label>
                          <Select
                            value={newFeeForm.paymentMethod}
                            onValueChange={(val: "CASH" | "TRANSFER") => setNewFeeForm({ ...newFeeForm, paymentMethod: val })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">Efectivo</SelectItem>
                              <SelectItem value="TRANSFER">Transferencia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Referencia (opcional)</label>
                          <Input
                            placeholder="No. de recibo o transferencia"
                            value={newFeeForm.reference}
                            onChange={(e) => setNewFeeForm({ ...newFeeForm, reference: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateFeeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateFee} disabled={createFee.isPending || createPayment.isPending}>
                {createFee.isPending || createPayment.isPending
                  ? "Registrando..."
                  : existingPendingFee
                    ? "Registrar Pago"
                    : newFeeForm.markAsPaid ? "Crear y Registrar Pago" : "Crear Cuota"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt View Dialog */}
        <Dialog open={!!receiptDialog} onOpenChange={() => { setReceiptDialog(null); setReceiptFee(null); }}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Recibo de Pago</DialogTitle>
              <DialogDescription>Vista del recibo de pago</DialogDescription>
            </DialogHeader>
            {receiptDialog && (() => {
              const student = receiptFee?.student || {};
              const orgName = student.organization?.name || 'Institución Educativa';
              const isFoundisalud = orgName.toLowerCase().includes('fundisalud');
              const licencias = isFoundisalud
                ? 'Licencia de funcionamiento #1408 del 13 de abril del 2021'
                : 'Licencia #0689 del 12 de abril del 2023 | Licencia #3276 del 02 de diciembre del 2024';
              const reference = receiptDialog.payment?.reference || receiptDialog.notes || '';

              return (
              <div id="receipt-print-area-finanzas" style={{ background: 'white' }}>
                <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #1E88E5 100%)' }} className="px-6 pt-6 pb-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#F9A825', transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <img src="/logo-horizontal.png" alt="Logo" className="h-10 object-contain" />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-lg font-bold tracking-widest uppercase">{orgName}</h2>
                    {isFoundisalud && (
                      <p className="text-blue-100 text-[11px] mt-0.5 italic">Fundación integral para la enseñanza y la salud</p>
                    )}
                    <p className="text-blue-100 text-xs mt-0.5">Cartagena - Arjona</p>
                    <p className="text-blue-200 text-[9px] mt-1 leading-tight opacity-80">{licencias}</p>
                  </div>
                </div>

                <div className="px-6 pt-4 pb-6 space-y-5">
                  <div className="flex justify-end -mt-4 mb-1">
                    <div className="px-4 py-1.5 rounded-full font-mono text-sm font-bold shadow-lg" style={{ background: '#F9A825', color: '#1565C0' }}>
                      {receiptDialog.receiptNumber}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(receiptDialog.date || receiptDialog.createdAt).toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>

                  <div className="rounded-xl border p-4" style={{ borderColor: '#1565C020', background: '#1565C005' }}>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground font-medium">Estudiante</span>
                      <span className="font-semibold">{student.name} {student.lastName || ''}</span>
                      <span className="text-muted-foreground font-medium">Identificación</span>
                      <span className="font-mono">{student.numeroIdentificacion || student.admissionNo}</span>
                      <span className="text-muted-foreground font-medium">Programa</span>
                      <span>{student.class?.name || '-'}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4" style={{ borderColor: '#F9A82530', background: '#F9A82508' }}>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Concepto</p>
                    <p className="font-semibold text-base">{receiptDialog.concept}</p>
                    {receiptDialog.payment?.method && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {getMethodLabel(receiptDialog.payment.method)}
                      </p>
                    )}
                    {reference && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Ref:</span> {reference}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #F9A825 0%, #F57F17 100%)' }}>
                    <p className="text-yellow-900/70 text-xs uppercase tracking-widest mb-1 font-medium">Total Pagado</p>
                    <p className="text-3xl font-bold font-mono text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                      ${receiptDialog.amount.toLocaleString("es-CO")}
                    </p>
                  </div>

                  <div className="text-center pt-3 border-t space-y-1">
                    <p className="text-[10px] text-muted-foreground">Documento generado electrónicamente</p>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-6 h-0.5 rounded-full" style={{ background: '#F9A825' }} />
                      <div className="w-6 h-0.5 rounded-full" style={{ background: '#1565C0' }} />
                      <div className="w-6 h-0.5 rounded-full" style={{ background: '#F9A825' }} />
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}
            {receiptDialog && (() => {
              const student = receiptFee?.student || {};
              const orgName = student.organization?.name || 'Institución Educativa';
              const isFundi = orgName.toLowerCase().includes('fundisalud');
              const subtitle = isFundi ? 'Fundación integral para la enseñanza y la salud' : '';
              const lics = isFundi
                ? 'Licencia de funcionamiento #1408 del 13 de abril del 2021'
                : 'Licencia #0689 del 12 de abril del 2023 | Licencia #3276 del 02 de diciembre del 2024';
              const studentName = `${student.name || ''} ${student.lastName || ''}`.trim();
              const studentDoc = student.numeroIdentificacion || student.admissionNo || '';
              const programa = student.class?.name || '-';
              const semestre = student.section?.name || '';
              const dateStr = new Date(receiptDialog.date || receiptDialog.createdAt).toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              const method = receiptDialog.payment?.method ? getMethodLabel(receiptDialog.payment.method) : '';
              const ref = receiptDialog.payment?.reference || receiptDialog.notes || '';
              const amount = `$${receiptDialog.amount.toLocaleString("es-CO")}`;

              const receiptBlock = (copyLabel: string) => `
                <div class="receipt">
                  <div class="header">
                    <img src="/logo-horizontal.png" class="logo" alt="Logo">
                    <div class="header-text">
                      <div class="org-name">${orgName.toUpperCase()}</div>
                      ${subtitle ? `<div class="org-subtitle">${subtitle}</div>` : ''}
                      <div class="org-addr">Cartagena - Arjona</div>
                      <div class="org-lic">${lics}</div>
                    </div>
                    <div class="receipt-num">${receiptDialog.receiptNumber}</div>
                  </div>
                  <div class="body">
                    <div class="copy-label">${copyLabel}</div>
                    <div class="date">${dateStr}</div>
                    <div class="info-grid">
                      <span class="lbl">Estudiante</span><span class="val">${studentName}</span>
                      <span class="lbl">Identificación</span><span class="val mono">${studentDoc}</span>
                      <span class="lbl">Programa</span><span class="val">${programa}</span>
                      ${semestre ? `<span class="lbl">Semestre</span><span class="val">${semestre}</span>` : ''}
                    </div>
                    <div class="concept-row">
                      <span class="lbl">Concepto</span>
                      <span class="val-concept">${receiptDialog.concept}</span>
                    </div>
                    ${method ? `<div class="detail-row"><span class="lbl">Método</span><span class="val">${method}</span></div>` : ''}
                    ${ref ? `<div class="detail-row"><span class="lbl">Referencia</span><span class="val">${ref}</span></div>` : ''}
                    <div class="total-row">
                      <span>TOTAL PAGADO</span>
                      <span class="total-amount">${amount}</span>
                    </div>
                    <div class="signature-area">
                      <div class="sig-line"><div class="line"></div><span>Firma Estudiante</span></div>
                      <div class="sig-line"><div class="line"></div><span>Firma Autorizada</span></div>
                    </div>
                  </div>
                </div>`;

              const printStyles = `
  @page { size: letter; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .receipt { border: 1px solid #ccc; margin-bottom: 8mm; page-break-inside: avoid; }
  .header { background: linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #1E88E5 100%); color: white; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
  .logo { height: 32px; flex-shrink: 0; }
  .header-text { flex: 1; }
  .org-name { font-size: 14px; font-weight: 800; letter-spacing: 1.5px; }
  .org-subtitle { font-size: 9px; opacity: 0.85; font-style: italic; }
  .org-addr { font-size: 10px; opacity: 0.8; }
  .org-lic { font-size: 8px; opacity: 0.7; margin-top: 1px; }
  .receipt-num { background: #F9A825; color: #1565C0; font-family: 'Courier New', monospace; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 12px; white-space: nowrap; }
  .body { padding: 10px 16px 12px; color: #000; }
  .copy-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #999; text-align: right; margin-bottom: 2px; }
  .date { font-size: 11px; color: #555; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 100px 1fr; gap: 2px 8px; font-size: 11px; margin-bottom: 8px; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px; }
  .lbl { color: #666; font-weight: 500; font-size: 10px; }
  .val { font-weight: 600; font-size: 11px; }
  .val.mono { font-family: 'Courier New', monospace; }
  .concept-row { font-size: 11px; margin-bottom: 4px; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px; }
  .val-concept { font-weight: 700; font-size: 12px; display: block; margin-top: 2px; }
  .detail-row { display: flex; gap: 8px; font-size: 10px; margin-bottom: 2px; padding: 0 6px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 8px 12px; border: 2px solid #333; border-radius: 4px; font-weight: 700; font-size: 12px; }
  .total-amount { font-family: 'Courier New', monospace; font-size: 16px; }
  .signature-area { display: flex; justify-content: space-between; margin-top: 16px; gap: 20px; }
  .sig-line { flex: 1; text-align: center; }
  .sig-line .line { border-top: 1px solid #333; margin-bottom: 3px; margin-top: 24px; }
  .sig-line span { font-size: 9px; color: #555; }
  .separator { border: none; border-top: 1px dashed #aaa; margin: 0; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`;

              const openPrintWindow = (html: string, title: string) => {
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${printStyles}</style></head><body>${html}<script>window.onload=function(){window.print();}<\/script></body></html>`);
                w.document.close();
              };

              return (
              <div className="flex justify-end gap-2 px-6 pb-4 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => { setReceiptDialog(null); setReceiptFee(null); }}>
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  style={{ background: '#1565C0' }}
                  onClick={() => openPrintWindow(receiptBlock(''), `Recibo ${receiptDialog.receiptNumber}`)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPrintWindow(
                    `${receiptBlock('Copia Estudiante')}<hr class="separator">${receiptBlock('Copia Institución')}`,
                    `Recibo ${receiptDialog.receiptNumber}`
                  )}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir x2 (Carta)
                </Button>
                <Button
                  size="sm"
                  style={{ background: '#1565C0' }}
                  onClick={async () => {
                    const el = document.getElementById('receipt-print-area-finanzas');
                    if (!el) return;
                    try {
                      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                      const imgData = canvas.toDataURL('image/png');
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      const pdfWidth = pdf.internal.pageSize.getWidth();
                      const imgWidth = pdfWidth - 20;
                      const imgHeight = (canvas.height * imgWidth) / canvas.width;
                      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                      pdf.save(`Recibo-${receiptDialog.receiptNumber}.pdf`);
                    } catch (err) { console.error(err); }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF Color
                </Button>
              </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
