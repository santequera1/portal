import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/contexts/OrganizationContext";
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
import { useFees, useFinanceSummary, useCreatePayment } from "@/hooks/useFees";
import { useTransactions, useCreateTransaction, useDeleteTransaction } from "@/hooks/useTransactions";
import { useSearch } from "@/hooks/useSearch";
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
} from "lucide-react";
import type { Fee, Transaction, SearchResult } from "@/types";

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: "Pagado", color: "bg-success/10 text-success", icon: CheckCircle2 },
  PARTIAL: { label: "Parcial", color: "bg-warning/10 text-warning", icon: Clock },
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
}: {
  onSelect: (concept: ConceptOption) => void;
  customConcept: string;
  onCustomConceptChange: (value: string) => void;
  onCustomConceptSubmit: () => void;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const concepts: { value: ConceptOption; label: string }[] = [
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {concepts.map((c) => (
          <Card
            key={c.value}
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => {
              if (c.value === "Otro") {
                setShowCustomInput(true);
              } else {
                onSelect(c.value);
              }
            }}
          >
            <CardContent className="flex items-center justify-center py-5">
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
  const isValid = data.paymentMethod && data.amount > 0;

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
            value={data.amount || ""}
            onChange={(e) => onChange({ amount: Number(e.target.value) })}
          />
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
  const { selectedOrgId } = useOrganization();

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
  const [txTypeFilter, setTxTypeFilter] = useState<string>("");
  const [txFromDate, setTxFromDate] = useState<string>("");
  const [txToDate, setTxToDate] = useState<string>("");

  // Delete transaction state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Queries
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary();
  const { data: feesData, isLoading: feesLoading } = useFees({
    status: feeStatusFilter || undefined,
  });
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({
    type: txTypeFilter || undefined,
    from: txFromDate || undefined,
    to: txToDate || undefined,
  });

  const createPayment = useCreatePayment();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const fees = feesData?.fees || [];
  const transactions = transactionsData?.transactions || [];

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
              updateWizardData({ concept });
              setWizardStep(5);
            }}
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
              <div className="flex flex-col md:flex-row gap-4">
                <Select
                  value={feeStatusFilter || "all"}
                  onValueChange={(val) => setFeeStatusFilter(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PAID">Pagado</SelectItem>
                    <SelectItem value="PARTIAL">Parcial</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="OVERDUE">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Estudiante</TableHead>
                    <TableHead className="font-semibold">Curso</TableHead>
                    <TableHead className="font-semibold text-right">Monto</TableHead>
                    <TableHead className="font-semibold text-right">Pagado</TableHead>
                    <TableHead className="font-semibold text-right">Pendiente</TableHead>
                    <TableHead className="font-semibold text-center">Vencimiento</TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : fees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
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
                            {fee.student?.name || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {fee.student?.class?.name || "-"} {fee.student?.section?.name || ""}
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
                          <Badge variant="secondary" className="bg-muted">
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
      </div>
    </MainLayout>
  );
}
