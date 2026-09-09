import React, { useEffect, useRef, useState } from "react";
import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.css";
import "../../assets/css/CostingEntryForm.css";
import API_BASE_URL from "../../config/api";

// MONTHS

const months = [
  { value: "January", label: "January" },
  { value: "February", label: "February" },
  { value: "March", label: "March" },
  { value: "April", label: "April" },
  { value: "May", label: "May" },
  { value: "June", label: "June" },
  { value: "July", label: "July" },
  { value: "August", label: "August" },
  { value: "September", label: "September" },
  { value: "October", label: "October" },
  { value: "November", label: "November" },
  { value: "December", label: "December" },
];

// FINANCIAL YEARS

const generateFinancialYears = () => {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 11 }, (_, index) => {
    const year = currentYear - 5 + index;

    return {
      value: `${year}-${String(year + 1).slice(-2)}`,
      label: `${year}-${String(year + 1).slice(-2)}`,
    };
  });
};

const financialYears = generateFinancialYears();

// DEFAULT VALUES

const getToday = () => new Date();

const getDefaultMonth = () => {
  return months[getToday().getMonth()].value;
};

const getDefaultFinancialYear = () => {
  const year = getToday().getFullYear();

  return `${year}-${String(year + 1).slice(-2)}`;
};

const getDefaultDate = () => {
  const date = getToday();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// EMPTY FORM
const getInitialFormData = () => ({
  // Period Details
  financialYear: getDefaultFinancialYear(),
  month: getDefaultMonth(),
  effectiveDate: getDefaultDate(),

  // Customer & Unit Details
  customerName: "",
  productionUnit: "",
  billingUnit: "",
  subDepartment: "",
  subCategory: "",

  // Part Details
  partNo: "",
  netWeight: "",
  grossWeight: "",
  hasBop: "",
  compMonth: "",

  // Process Details
  processType: "",
  machineTonnage: "",
  totalCavity: "",
  runningCavity: "",
  cycleTime: "",
  PlattenSize: "",
  toolSize: "",

  // Additional Process Costs
  postCuring: "",
  finishing: "",
  inspection: "",
  assemblyPerCost: "",

  // Production Details
  monthlyQuantity: "",
});

// COMPONENT
const CostingEntryForm = () => {

  // FORM STATE
  const [formData, setFormData] = useState(getInitialFormData());

  // MASTER DATA

  const [customers, setCustomers] = useState([]);
  const [units, setUnits] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [parts, setParts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [bopMasters, setBopMasters] = useState([]);
  const [bopMasterLoading, setBopMasterLoading] = useState(false);

  // BOP ENTRY STATE

  const [loading, setLoading] = useState(true);
  const [subDepartmentLoading, setSubDepartmentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [bops, setBops] = useState([]);

  // TOMSELECT REFS

  const customerSelectRef = useRef(null);
  const partSelectRef = useRef(null);

  const customerTomSelectRef = useRef(null);
  const partTomSelectRef = useRef(null);

  // LOAD MASTER DATA

  useEffect(() => {
    let cancelled = false;

    const loadMasters = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          customerResponse,
          unitsResponse,
          categoryResponse,
          partsResponse,
          machinesResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/customers`),
          fetch(`${API_BASE_URL}/units`),
          fetch(`${API_BASE_URL}/subcategories?category=Molding`),
          fetch(`${API_BASE_URL}/parts`),
          fetch(`${API_BASE_URL}/machines`),
        ]);

        if (!customerResponse.ok) {
          throw new Error("Failed to load customers.");
        }

        if (!unitsResponse.ok) {
          throw new Error("Failed to load units.");
        }

        if (!categoryResponse.ok) {
          throw new Error("Failed to load subcategories.");
        }

        if (!partsResponse.ok) {
          throw new Error("Failed to load parts.");
        }

        if (!machinesResponse.ok) {
          throw new Error("Failed to load machines.");
        }

        const [customerData, unitData, categoryData, partData, machineData] =
          await Promise.all([
            customerResponse.json(),
            unitsResponse.json(),
            categoryResponse.json(),
            partsResponse.json(),
            machinesResponse.json(),
          ]);

        if (cancelled) return;

        setCustomers(
          Array.isArray(customerData) ? customerData : customerData?.data || [],
        );

        setUnits(Array.isArray(unitData) ? unitData : unitData?.data || []);

        setSubCategories(
          Array.isArray(categoryData) ? categoryData : categoryData?.data || [],
        );

        setParts(Array.isArray(partData) ? partData : partData?.data || []);

        setMachines(
          Array.isArray(machineData) ? machineData : machineData?.data || [],
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Master data error:", err);

        setError(err.message || "Unable to load master data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMasters();

    return () => {
      cancelled = true;
    };
  }, []);

  // LOAD BOP MASTER

  useEffect(() => {
    let cancelled = false;

    const loadBopMasters = async () => {
      try {
        setBopMasterLoading(true);

        const response = await fetch(`${API_BASE_URL}/bops`);

        if (!response.ok) {
          throw new Error("Failed to load BOP master.");
        }

        const data = await response.json();

        if (cancelled) return;

        setBopMasters(
          Array.isArray(data) ? data : data?.data || []
        );
      } catch (err) {
        if (cancelled) return;

        console.error("BOP master error:", err);
        setBopMasters([]);
      } finally {
        if (!cancelled) {
          setBopMasterLoading(false);
        }
      }
    };

    loadBopMasters();

    return () => {
      cancelled = true;
    };
  }, []);

  // LOAD SUB DEPARTMENTS

  useEffect(() => {
    let cancelled = false;

    const loadSubDepartments = async () => {
      if (!formData.productionUnit) {
        setSubDepartments([]);
        return;
      }

      try {
        setSubDepartmentLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/subdepartments?unitId=${encodeURIComponent(
            formData.productionUnit,
          )}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load sub departments.");
        }

        const data = await response.json();

        if (cancelled) return;

        setSubDepartments(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        if (cancelled) return;

        console.error("Sub department error:", err);

        setSubDepartments([]);
      } finally {
        if (!cancelled) {
          setSubDepartmentLoading(false);
        }
      }
    };

    loadSubDepartments();

    return () => {
      cancelled = true;
    };
  }, [formData.productionUnit]);

  // CUSTOMER TOMSELECT

  useEffect(() => {
    if (!customerSelectRef.current || customers.length === 0) {
      return;
    }

    // Destroy existing TomSelect
    if (customerTomSelectRef.current) {
      customerTomSelectRef.current.destroy();
      customerTomSelectRef.current = null;
    }

    const selectElement = customerSelectRef.current;

    // Remove old options
    selectElement.innerHTML = "";

    // Empty option
    const emptyOption = document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "";

    selectElement.appendChild(emptyOption);

    // Add customers
    customers.forEach((customer) => {
      const value =
        customer.customer_name ??
        customer.customerName ??
        customer.name ??
        customer.customer_code ??
        customer.code ??
        customer.id ??
        "";

      const label =
        customer.customer_name ??
        customer.customerName ??
        customer.name ??
        customer.customer_code ??
        customer.code ??
        value;

      if (!value) return;

      const option = document.createElement("option");

      option.value = String(value);
      option.textContent = String(label);

      selectElement.appendChild(option);
    });

    // Initialize TomSelect
    customerTomSelectRef.current = new TomSelect(selectElement, {
      create: false,
      allowEmptyOption: true,
      maxOptions: null,

      placeholder: "Search Customer...",

      searchField: ["text", "value"],

      sortField: {
        field: "text",
        direction: "asc",
      },

      dropdownParent: "body",

      onChange: (value) => {
        setFormData((prev) => ({
          ...prev,
          customerName: value,
        }));

        setMessage("");
        setError("");
      },
    });

    // Restore selected value
    if (formData.customerName) {
      customerTomSelectRef.current.setValue(formData.customerName, true);
    }

    return () => {
      if (customerTomSelectRef.current) {
        customerTomSelectRef.current.destroy();
        customerTomSelectRef.current = null;
      }
    };
  }, [customers]);

  // PART NO TOMSELECT

  useEffect(() => {
    if (!partSelectRef.current || parts.length === 0) {
      return;
    }

    // Destroy existing TomSelect
    if (partTomSelectRef.current) {
      partTomSelectRef.current.destroy();
      partTomSelectRef.current = null;
    }

    const selectElement = partSelectRef.current;

    // Remove old options
    selectElement.innerHTML = "";

    // Empty option
    const emptyOption = document.createElement("option");

    emptyOption.value = "";
    emptyOption.textContent = "";

    selectElement.appendChild(emptyOption);

    // Add parts
    parts.forEach((part) => {
      const value =
        part.part_no ??
        part.partNo ??
        part.part_number ??
        part.partNumber ??
        part.id ??
        "";

      const label =
        part.part_no ??
        part.partNo ??
        part.part_number ??
        part.partNumber ??
        part.name ??
        value;

      if (!value) return;

      const option = document.createElement("option");

      option.value = String(value);
      option.textContent = String(label);

      selectElement.appendChild(option);
    });

    // Initialize TomSelect
    partTomSelectRef.current = new TomSelect(selectElement, {
      create: false,
      allowEmptyOption: true,
      maxOptions: null,

      placeholder: "Search Part No...",

      searchField: ["text", "value"],

      sortField: {
        field: "text",
        direction: "asc",
      },

      dropdownParent: "body",

      onChange: (value) => {
        setFormData((prev) => ({
          ...prev,
          partNo: value,
        }));

        setMessage("");
        setError("");
      },
    });

    // Restore selected value
    if (formData.partNo) {
      partTomSelectRef.current.setValue(formData.partNo, true);
    }

    return () => {
      if (partTomSelectRef.current) {
        partTomSelectRef.current.destroy();
        partTomSelectRef.current = null;
      }
    };
  }, [parts]);

  // NORMAL INPUT CHANGE

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "hasBop") {
      setFormData((prev) => ({
        ...prev,
        hasBop: value,
        ...(value === "No" && {
          assemblyPerCost: "",
        }),
      }));

      if (value === "Yes" && bops.length === 0) {
        setBops([createEmptyBop()]);
      }

      if (value === "No") {
        setBops([]);
      }

      setMessage("");
      setError("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // NON NEGATIVE NUMBER

  const handleNonNegativeNumber = (event) => {
    const { name, value } = event.target;

    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [name]: "",
      }));

      return;
    }

    if (Number(value) < 0) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // INTEGER INPUT

  const handleIntegerInput = (event) => {
    const { name, value } = event.target;

    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [name]: "",
      }));

      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // PROCESS TYPES

  const processTypes = [
    ...new Set(
      machines
        .map(
          (machine) =>
            machine.molding_process ??
            machine.moldingProcess ??
            machine.process_type ??
            machine.processType,
        )
        .filter(Boolean),
    ),
  ].sort();

  // FILTER MACHINES

  const filteredMachines = machines.filter((machine) => {
    const process =
      machine.molding_process ??
      machine.moldingProcess ??
      machine.process_type ??
      machine.processType;

    return !formData.processType || process === formData.processType;
  });

  // MACHINE TONNAGES

  const machineTonnages = [
    ...new Set(
      filteredMachines
        .map(
          (machine) =>
            machine.machine_list ??
            machine.machineList ??
            machine.tonnage ??
            machine.machine_tonnage ??
            machine.machineTonnage,
        )
        .filter(Boolean),
    ),
  ].sort((a, b) => {
    const numberA = parseFloat(a);
    const numberB = parseFloat(b);

    if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
      return numberA - numberB;
    }

    return String(a).localeCompare(String(b));
  });

  // BOP HELPERS

  const createEmptyBop = () => ({
    id: `${Date.now()}-${Math.random()}`,
    bopId: "",
    bopFgCode: "",
    supplierId: "",
    supplierName: "",
    bopAssemblyQty: "",
    bopMonth: "",
    bopRate: "",
    bopRateLoading: false,
  });

  const getBopSuppliers = (bopMaster) => {
    if (!bopMaster) return [];

    const supplierIds = String(bopMaster.supplier_id || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const supplierNames = String(bopMaster.supplier_name || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    return supplierIds.map((id, index) => ({
      id,
      supplier_name: supplierNames[index] || `Supplier ${id}`,
    }));
  };

  const getBopLabel = (bop) =>
    bop.bop_erp_code ??
    bop.bop_fg_code ??
    bop.fg_code ??
    bop.code ??
    `BOP ${bop.id}`;

  const handleBopFgCodeChange = (rowId, selectedBopId) => {
    const selectedBop = bopMasters.find(
      (item) => String(item.id) === String(selectedBopId)
    );

    if (!selectedBop) {
      setBops((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                bopId: "",
                bopFgCode: "",
                supplierId: "",
                supplierName: "",
                bopAssemblyQty: "",
                bopMonth: "",
                bopRate: "",
              }
            : row
        )
      );
      return;
    }

    setBops((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              bopId: selectedBop.id,
              bopFgCode: getBopLabel(selectedBop),
              supplierId: "",
              supplierName: "",
              bopRate: "",
            }
          : row
      )
    );
  };

  const handleBopSupplierChange = async (rowId, supplierId) => {
    const row = bops.find((item) => item.id === rowId);
    const bopMaster = bopMasters.find(
      (item) => String(item.id) === String(row?.bopId)
    );

    const supplier = getBopSuppliers(bopMaster).find(
      (item) => String(item.id) === String(supplierId)
    );

    setBops((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              supplierId,
              supplierName: supplier?.supplier_name || "",
              bopRate: "",
            }
          : item
      )
    );

    if (supplierId && row?.bopMonth) {
      await fetchBopRateForRow({
        rowId,
        bopId: row.bopId,
        supplierId,
        month: row.bopMonth,
      });
    }
  };

  const fetchBopRateForRow = async ({
    rowId,
    bopId,
    supplierId,
    month,
  }) => {
    if (!bopId || !supplierId || !month || !formData.financialYear) {
      return null;
    }

    setBops((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, bopRateLoading: true, bopRate: "" }
          : row
      )
    );

    try {
      const params = new URLSearchParams({
        bopId: String(bopId),
        supplierId: String(supplierId),
        financial_year: String(formData.financialYear),
        month: String(month),
      });

      const response = await fetch(
        `${API_BASE_URL}/bop-rate-for-costing?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch BOP rate.");
      }

      const rate = result.found ? Number(result.rate) : null;

      setBops((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                bopRate: rate === null ? "" : rate,
                bopRateLoading: false,
              }
            : row
        )
      );

      return rate;
    } catch (err) {
      console.error("BOP rate error:", err);

      setBops((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                bopRate: "",
                bopRateLoading: false,
              }
            : row
        )
      );

      return null;
    }
  };

  const handleBopMonthChange = async (rowId, month) => {
    const row = bops.find((item) => item.id === rowId);

    setBops((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? { ...item, bopMonth: month, bopRate: "" }
          : item
      )
    );

    if (row?.bopId && row?.supplierId && month) {
      await fetchBopRateForRow({
        rowId,
        bopId: row.bopId,
        supplierId: row.supplierId,
        month,
      });
    }
  };

  const handleBopAssemblyQtyChange = (rowId, value) => {
    if (value !== "" && (Number(value) < 0 || Number.isNaN(Number(value)))) {
      return;
    }

    setBops((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, bopAssemblyQty: value } : row
      )
    );

    setMessage("");
    setError("");
  };

  const addBop = () => {
    setBops((prev) => [...prev, createEmptyBop()]);
  };

  const deleteBop = (rowId) => {
    setBops((prev) => prev.filter((row) => row.id !== rowId));
  };

  // VALIDATION

  const validateForm = () => {
    const requiredFields = [
      ["financialYear", "Financial Year"],
      ["month", "Month"],
      ["effectiveDate", "Effective Date"],
      ["customerName", "Customer"],
      ["productionUnit", "Production Unit"],
      ["billingUnit", "Billing Unit"],
      ["subDepartment", "Sub Department"],
      ["subCategory", "Subcategory"],
      ["partNo", "Part No"],
      ["netWeight", "Net Weight"],
      ["grossWeight", "Gross Weight"],
      ["hasBop", "BOP"],
      ["compMonth", "Compound Month"],
      ["processType", "Process Type"],
      ["machineTonnage", "Machine Tonnage"],
      ["totalCavity", "Total Cavity"],
      ["runningCavity", "Running Cavity"],
      ["cycleTime", "Cycle Time"],
      ["PlattenSize", "Platten Size"],
      ["toolSize", "Tool Size"],
      ["postCuring", "Post Curing"],
      ["finishing", "Finishing"],
      ["inspection", "Inspection"],
      ["monthlyQuantity", "Monthly Quantity"],
    ];

    for (const [field, label] of requiredFields) {
      if (
        formData[field] === "" ||
        formData[field] === null ||
        formData[field] === undefined
      ) {
        return `${label} is required.`;
      }
    }

    const totalCavity = Number(formData.totalCavity);

    const runningCavity = Number(formData.runningCavity);

    if (runningCavity > totalCavity) {
      return "Running Cavity cannot be greater than Total Cavity.";
    }

    if (!Number.isInteger(totalCavity)) {
      return "Total Cavity must be a whole number.";
    }

    if (!Number.isInteger(runningCavity)) {
      return "Running Cavity must be a whole number.";
    }

    const monthlyQuantity = Number(formData.monthlyQuantity);

    if (!Number.isInteger(monthlyQuantity)) {
      return "Monthly Quantity must be a whole number.";
    }

    const numericFields = [
      ["netWeight", "Net Weight"],
      ["grossWeight", "Gross Weight"],
      ["cycleTime", "Cycle Time"],
      ["postCuring", "Post Curing"],
      ["finishing", "Finishing"],
      ["inspection", "Inspection"],
    ];

    for (const [field, label] of numericFields) {
      const value = Number(formData[field]);

      if (Number.isNaN(value) || value < 0) {
        return `${label} must be a valid non-negative number.`;
      }
    }

    if (formData.hasBop === "Yes") {
      if (bops.length === 0) {
        return "At least one BOP detail is required when BOP is Yes.";
      }

      for (let index = 0; index < bops.length; index += 1) {
        const row = bops[index];

        if (!row.bopId) {
          return `BOP Row ${index + 1}: BOP FG Code is required.`;
        }

        if (!row.supplierId) {
          return `BOP Row ${index + 1}: Supplier is required.`;
        }

        if (
          row.bopAssemblyQty === "" ||
          Number(row.bopAssemblyQty) < 0 ||
          Number.isNaN(Number(row.bopAssemblyQty))
        ) {
          return `BOP Row ${index + 1}: Assembly Qty is required and must be non-negative.`;
        }

        if (!row.bopMonth) {
          return `BOP Row ${index + 1}: BOP Month is required.`;
        }

        if (row.bopRate === "" || row.bopRate === null || row.bopRate === undefined) {
          return `BOP Row ${index + 1}: BOP monthly rate was not found for the selected month.`;
        }
      }
    }

    if (formData.hasBop === "No" && bops.length > 0) {
      // Safety reset in case a stale BOP row remains.
      setBops([]);
    }

    return "";
  };

  // SUBMIT

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const costingEntry = {
      financialYear: formData.financialYear,
      month: formData.month,
      effectiveDate: formData.effectiveDate,

      customerName: formData.customerName,
      productionUnit: (() => {
        const selected = units.find(
          (unit) =>
            String(getUnitValue(unit)) === String(formData.productionUnit),
        );
        return selected ? getUnitLabel(selected) : formData.productionUnit;
      })(),
      billingUnit: (() => {
        const selected = units.find(
          (unit) => String(getUnitValue(unit)) === String(formData.billingUnit),
        );
        return selected ? getUnitLabel(selected) : formData.billingUnit;
      })(),
      subDepartment: (() => {
        const selected = subDepartments.find(
          (department) =>
            String(getSubDepartmentValue(department)) ===
            String(formData.subDepartment),
        );
        return selected
          ? getSubDepartmentLabel(selected)
          : formData.subDepartment;
      })(),
      subCategory: (() => {
        const selected = subCategories.find(
          (category) =>
            String(getSubCategoryValue(category)) ===
            String(formData.subCategory),
        );
        return selected ? getSubCategoryLabel(selected) : formData.subCategory;
      })(),

      partNo: formData.partNo,
      netWeight: Number(formData.netWeight),
      grossWeight: Number(formData.grossWeight),
      hasBop: formData.hasBop,
      compMonth: formData.compMonth,

      processType: formData.processType,
      machineTonnage: formData.machineTonnage,
      totalCavity: Number(formData.totalCavity),
      runningCavity: Number(formData.runningCavity),
      cycleTime: Number(formData.cycleTime),
      PlattenSize: formData.PlattenSize,
      toolSize: formData.toolSize,

      postCuring: Number(formData.postCuring),
      finishing: Number(formData.finishing),
      inspection: Number(formData.inspection),
      assemblyPerCost:
        formData.hasBop === "Yes"
          ? Number(formData.assemblyPerCost)
          : 0,

      bops:
        formData.hasBop === "Yes"
          ? bops.map((row) => ({
              bopId: row.bopId,
              bopFgCode: row.bopFgCode,
              supplierId: row.supplierId,
              supplierName: row.supplierName,
              bopAssemblyQty: Number(row.bopAssemblyQty),
              bopMonth: row.bopMonth,
              bopRate: Number(row.bopRate),
            }))
          : [],

      monthlyQuantity: Number(formData.monthlyQuantity),
    };

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/costing-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData: costingEntry,
        }),
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to save costing entry.");
      }

      console.log("Employee Costing Entry Saved:", {
        ...costingEntry,
        entryId: result.entryId,
        id: result.id,
      });

      setMessage(
        result.entryId
          ? `Costing entry saved successfully. Entry ID: ${result.entryId}`
          : "Costing entry saved successfully.",
      );

      // Show the success message first, then clear the form.
      setTimeout(() => {
        setFormData(getInitialFormData());
        setBops([]);

        if (customerTomSelectRef.current) {
          customerTomSelectRef.current.clear();
        }

        if (partTomSelectRef.current) {
          partTomSelectRef.current.clear();
        }
      }, 2000);
    } catch (err) {
      console.error("Costing entry save error:", err);

      setError(
        err.message || "Unable to save costing entry. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // RESET

  const handleReset = () => {
    setFormData(getInitialFormData());
    setBops([]);

    setMessage("");
    setError("");

    if (customerTomSelectRef.current) {
      customerTomSelectRef.current.clear();
    }

    if (partTomSelectRef.current) {
      partTomSelectRef.current.clear();
    }
  };

  // UNIT HELPERS

  const getUnitValue = (unit) =>
    unit.unit_id ??
    unit.id ??
    unit.unitId ??
    unit.unit_code ??
    unit.unit_name ??
    unit.name ??
    "";

  const getUnitLabel = (unit) =>
    unit.unit ??
    unit.unit_name ??
    unit.unitName ??
    unit.name ??
    unit.unit_code ??
    unit.code ??
    getUnitValue(unit);

  // SUB DEPARTMENT HELPERS

  const getSubDepartmentValue = (department) =>
    department.id ??
    department.sub_department_id ??
    department.subDepartmentId ??
    department.sub_department ??
    department.name ??
    "";

  const getSubDepartmentLabel = (department) =>
    department.sub_department_name ??
    department.sub_department ??
    department.subDepartment ??
    department.subDepartmentName ??
    department.name ??
    department.department_name ??
    getSubDepartmentValue(department);

  // SUBCATEGORY HELPERS

  const getSubCategoryValue = (category) =>
    category.id ??
    category.subcategory_id ??
    category.subCategoryId ??
    category.subcategory ??
    category.name ??
    "";

  const getSubCategoryLabel = (category) =>
    category.sub_category_name ??
    category.subcategory_name ??
    category.subcategory ??
    category.subCategory ??
    category.subCategoryName ??
    category.name ??
    category.category_name ??
    getSubCategoryValue(category);

  // LOADING

  if (loading) {
    return (
      <div className="costing-entry-page">
        <div className="costing-entry-card">
          <div className="costing-entry-loading">
            Loading costing entry masters...
          </div>
        </div>
      </div>
    );
  }

  // RENDER

  return (
    <div className="costing-entry-page">
      <div className="costing-entry-card">
        {/* =========================================
            HEADER
        ========================================== */}

        <div className="costing-entry-header">
          <div>
            <h2>Costing Entry Form</h2>

            <p>
              Enter the production information required for costing preparation.
            </p>
          </div>
        </div>

        {/* =========================================
            ERROR
        ========================================== */}

        {error && <div className="costing-entry-alert error">{error}</div>}

        {/* =========================================
            SUCCESS
        ========================================== */}

        {message && (
          <div className="costing-entry-alert success">{message}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* =========================================
              1. PERIOD DETAILS
          ========================================== */}

          <section className="costing-entry-section">
            <div className="section-title">
              <span className="section-number">1</span>

              <span>Period Details</span>
            </div>

            <div className="costing-entry-grid">
              <div className="form-field">
                <label>
                  Financial Year <span>*</span>
                </label>

                <select
                  name="financialYear"
                  value={formData.financialYear}
                  onChange={handleChange}
                >
                  <option value="">Select Financial Year</option>

                  {financialYears.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>
                  Month <span>*</span>
                </label>

                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                >
                  <option value="">Select Month</option>

                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>
                  Effective Date <span>*</span>
                </label>

                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* =========================================
              2. CUSTOMER & UNIT DETAILS
          ========================================== */}

          <section className="costing-entry-section">
            <div className="section-title">
              <span className="section-number">2</span>

              <span>Customer & Unit Details</span>
            </div>

            <div className="costing-entry-grid">
              {/* CUSTOMER TOMSELECT */}

              <div className="form-field">
                <label>
                  Customer <span>*</span>
                </label>

                <select
                  ref={customerSelectRef}
                  name="customerName"
                  className="tomselect-customer"
                  autoComplete="off"
                >
                  <option value="">Select Customer</option>
                </select>
              </div>

              {/* PRODUCTION UNIT */}

              <div className="form-field">
                <label>
                  Production Unit <span>*</span>
                </label>

                <select
                  name="productionUnit"
                  value={formData.productionUnit}
                  onChange={handleChange}
                >
                  <option value="">Select Production Unit</option>

                  {units.map((unit, index) => (
                    <option
                      key={getUnitValue(unit) || index}
                      value={getUnitValue(unit)}
                    >
                      {getUnitLabel(unit)}
                    </option>
                  ))}
                </select>
              </div>

              {/* BILLING UNIT */}

              <div className="form-field">
                <label>
                  Billing Unit <span>*</span>
                </label>

                <select
                  name="billingUnit"
                  value={formData.billingUnit}
                  onChange={handleChange}
                >
                  <option value="">Select Billing Unit</option>

                  {units.map((unit, index) => (
                    <option
                      key={getUnitValue(unit) || index}
                      value={getUnitValue(unit)}
                    >
                      {getUnitLabel(unit)}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUB DEPARTMENT */}

              <div className="form-field">
                <label>
                  Sub Department <span>*</span>
                </label>

                <select
                  name="subDepartment"
                  value={formData.subDepartment}
                  onChange={handleChange}
                  disabled={!formData.productionUnit || subDepartmentLoading}
                >
                  <option value="">
                    {subDepartmentLoading
                      ? "Loading..."
                      : "Select Sub Department"}
                  </option>

                  {subDepartments.map((department, index) => (
                    <option
                      key={getSubDepartmentValue(department) || index}
                      value={getSubDepartmentValue(department)}
                    >
                      {getSubDepartmentLabel(department)}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBCATEGORY */}

              <div className="form-field">
                <label>
                  Subcategory <span>*</span>
                </label>

                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                >
                  <option value="">Select Subcategory</option>

                  {subCategories.map((category, index) => (
                    <option
                      key={getSubCategoryValue(category) || index}
                      value={getSubCategoryValue(category)}
                    >
                      {getSubCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* =========================================
              3. PART DETAILS
          ========================================== */}

          <section className="costing-entry-section">
            <div className="section-title">
              <span className="section-number">3</span>

              <span>Part Details</span>
            </div>

            <div className="costing-entry-grid">
              {/* PART NO TOMSELECT */}

              <div className="form-field">
                <label>
                  Part No <span>*</span>
                </label>

                <select
                  ref={partSelectRef}
                  name="partNo"
                  className="tomselect-part"
                  autoComplete="off"
                >
                  <option value="">Select Part No</option>
                </select>
              </div>

              {/* NET WEIGHT */}

              <div className="form-field">
                <label>
                  Net Weight <span>*</span>
                </label>

                <input
                  type="number"
                  name="netWeight"
                  value={formData.netWeight}
                  onChange={handleNonNegativeNumber}
                  min="0"
                  step="any"
                  placeholder="Enter net weight"
                />
              </div>

              {/* GROSS WEIGHT */}

              <div className="form-field">
                <label>
                  Gross Weight <span>*</span>
                </label>

                <input
                  type="number"
                  name="grossWeight"
                  value={formData.grossWeight}
                  onChange={handleNonNegativeNumber}
                  min="0"
                  step="any"
                  placeholder="Enter gross weight"
                />
              </div>

              {/* BOP */}

              <div className="form-field">
                <label>
                  BOP <span>*</span>
                </label>

                <select
                  name="hasBop"
                  value={formData.hasBop}
                  onChange={handleChange}
                >
                  <option value="">Select</option>

                  <option value="Yes">Yes</option>

                  <option value="No">No</option>
                </select>
              </div>

              {/* COMPOUND MONTH */}

              <div className="form-field">
                <label>
                  Compound Month <span>*</span>
                </label>

                <select
                  name="compMonth"
                  value={formData.compMonth}
                  onChange={handleChange}
                >
                  <option value="">Select Compound Month</option>

                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* =========================================
              4. PROCESS DETAILS
          ========================================== */}

          <section className="costing-entry-section">
            <div className="section-title">
              <span className="section-number">4</span>

              <span>Process Details</span>
            </div>

            <div className="costing-entry-grid">
              {/* PROCESS TYPE */}

              <div className="form-field">
                <label>
                  Process Type <span>*</span>
                </label>

                <select
                  name="processType"
                  value={formData.processType}
                  onChange={(event) => {
                    setFormData((prev) => ({
                      ...prev,
                      processType: event.target.value,
                      machineTonnage: "",
                    }));

                    setMessage("");
                    setError("");
                  }}
                >
                  <option value="">Select Process Type</option>

                  {processTypes.map((process) => (
                    <option key={process} value={process}>
                      {process}
                    </option>
                  ))}
                </select>
              </div>

              {/* MACHINE TONNAGE */}

              <div className="form-field">
                <label>
                  Machine Tonnage <span>*</span>
                </label>

                <select
                  name="machineTonnage"
                  value={formData.machineTonnage}
                  onChange={handleChange}
                  disabled={!formData.processType}
                >
                  <option value="">
                    {formData.processType
                      ? "Select Machine Tonnage"
                      : "Select Process Type First"}
                  </option>

                  {machineTonnages.map((tonnage, index) => (
                    <option key={`${tonnage}-${index}`} value={tonnage}>
                      {tonnage}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOTAL CAVITY */}

              <div className="form-field">
                <label>
                  Total Cavity <span>*</span>
                </label>

                <input
                  type="number"
                  name="totalCavity"
                  value={formData.totalCavity}
                  onChange={handleIntegerInput}
                  min="0"
                  step="1"
                  placeholder="Enter total cavity"
                />
              </div>

              {/* RUNNING CAVITY */}

              <div className="form-field">
                <label>
                  Running Cavity <span>*</span>
                </label>

                <input
                  type="number"
                  name="runningCavity"
                  value={formData.runningCavity}
                  onChange={handleIntegerInput}
                  min="0"
                  step="1"
                  max={formData.totalCavity || undefined}
                  placeholder="Enter running cavity"
                />
              </div>

              {/* CYCLE TIME */}

              <div className="form-field">
                <label>
                  Cycle Time <span>*</span>
                </label>

                <input
                  type="number"
                  name="cycleTime"
                  value={formData.cycleTime}
                  onChange={handleNonNegativeNumber}
                  min="0"
                  step="any"
                  placeholder="Enter cycle time"
                />
              </div>

              {/* PLATTEN SIZE */}

              <div className="form-field">
                <label>
                  Platten Size <span>*</span>
                </label>

                <input
                  type="text"
                  name="PlattenSize"
                  value={formData.PlattenSize}
                  onChange={handleChange}
                  placeholder="Enter platen size"
                />
              </div>

              {/* TOOL SIZE */}

              <div className="form-field">
                <label>
                  Tool Size <span>*</span>
                </label>

                <input
                  type="text"
                  name="toolSize"
                  value={formData.toolSize}
                  onChange={handleChange}
                  placeholder="Enter tool size"
                />
              </div>

              {/* MONTHLY QUANTITY */}
              <div className="form-field">
                <label>
                  Monthly Quantity <span>*</span>
                </label>

                <input
                  type="number"
                  name="monthlyQuantity"
                  value={formData.monthlyQuantity}
                  onChange={handleIntegerInput}
                  min="0"
                  step="1"
                  placeholder="Enter monthly quantity"
                />
              </div>
            </div>
          </section>

          {/* =========================================
              5. ADDITIONAL PROCESS COSTS
          ========================================== */}

          <section className="costing-entry-section">
            <div className="section-title">
              <span className="section-number">5</span>
              <span>Additional Process Costs</span>
            </div>

            <div className="costing-entry-grid">
              <div className="form-field">
                <label>
                  Post Curing <span>*</span>
                </label>

                <input
                  type="number"
                  name="postCuring"
                  value={formData.postCuring}
                  onChange={handleNonNegativeNumber}
                  min="0"
                  step="any"
                  placeholder="Enter post curing cost"
                />
              </div>

              <div className="form-field">
                <label>
                  Finishing <span>*</span>
                </label>

                <input
                  type="number"
                  name="finishing"
                  value={formData.finishing}
                  onChange={handleNonNegativeNumber}
                  min="0"
                  step="any"
                  placeholder="Enter finishing cost"
                />
              </div>

              <div className="form-field">
                <label>
                  Inspection <span>*</span>
                </label>

                <input
                  type="number"
                  name="inspection"
                  value={formData.inspection}
                  onChange={handleNonNegativeNumber}
                  min="0"
                  step="any"
                  placeholder="Enter inspection cost"
                />
              </div>

              {formData.hasBop === "Yes" && (
                <div className="form-field">
                  <label>
                    Assembly Per Cost <span>*</span>
                  </label>

                  <input
                    type="number"
                    name="assemblyPerCost"
                    value={formData.assemblyPerCost}
                    onChange={handleNonNegativeNumber}
                    min="0"
                    step="any"
                    placeholder="Enter assembly per cost"
                  />
                </div>
              )}
            </div>
          </section>

          {/* =========================================
              6. BOP DETAILS
          ========================================== */}

          {formData.hasBop === "Yes" && (
            <section className="costing-entry-section">
              <div className="section-title">
                <span className="section-number">6</span>
                <span>BOP Details</span>
              </div>

              <div className="costing-entry-bop-toolbar">
                <span>
                  Add one or more BOP components. Monthly BOP Rate is fetched
                  automatically from the selected BOP, supplier, financial year,
                  and month.
                </span>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={addBop}
                  disabled={bopMasterLoading}
                >
                  + Add BOP
                </button>
              </div>

              {bopMasterLoading ? (
                <div className="costing-entry-bop-loading">
                  Loading BOP master...
                </div>
              ) : bops.length === 0 ? (
                <div className="costing-entry-bop-empty">
                  No BOP added. Click <b>+ Add BOP</b> to add a BOP component.
                </div>
              ) : (
                <div className="costing-entry-bop-table-wrap">
                  <table className="costing-entry-bop-table">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>BOP FG Code *</th>
                        <th>Supplier *</th>
                        <th>Assembly Qty *</th>
                        <th>BOP Month *</th>
                        <th>BOP Monthly Rate</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {bops.map((row, index) => {
                        const selectedBopMaster = bopMasters.find(
                          (item) =>
                            String(item.id) === String(row.bopId)
                        );

                        const supplierOptions =
                          getBopSuppliers(selectedBopMaster);

                        return (
                          <tr key={row.id}>
                            <td>{index + 1}</td>

                            <td>
                              <select
                                value={row.bopId || ""}
                                onChange={(event) =>
                                  handleBopFgCodeChange(
                                    row.id,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">
                                  Select BOP FG Code
                                </option>

                                {bopMasters.map((bop) => (
                                  <option
                                    key={bop.id}
                                    value={bop.id}
                                  >
                                    {getBopLabel(bop)}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td>
                              <select
                                value={row.supplierId || ""}
                                onChange={(event) =>
                                  handleBopSupplierChange(
                                    row.id,
                                    event.target.value
                                  )
                                }
                                disabled={!row.bopId}
                              >
                                <option value="">
                                  {row.bopId
                                    ? "Select Supplier"
                                    : "Select BOP First"}
                                </option>

                                {supplierOptions.map((supplier) => (
                                  <option
                                    key={supplier.id}
                                    value={supplier.id}
                                  >
                                    {supplier.supplier_name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.bopAssemblyQty}
                                onChange={(event) =>
                                  handleBopAssemblyQtyChange(
                                    row.id,
                                    event.target.value
                                  )
                                }
                                placeholder="Qty"
                              />
                            </td>

                            <td>
                              <select
                                value={row.bopMonth || ""}
                                onChange={(event) =>
                                  handleBopMonthChange(
                                    row.id,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">
                                  Select Month
                                </option>

                                {months.map((month) => (
                                  <option
                                    key={month.value}
                                    value={month.value}
                                  >
                                    {month.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td>
                              <input
                                type="text"
                                value={
                                  row.bopRateLoading
                                    ? "Loading..."
                                    : row.bopRate === ""
                                      ? ""
                                      : Number(row.bopRate).toFixed(2)
                                }
                                readOnly
                                placeholder="Auto"
                              />
                            </td>

                            <td>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => deleteBop(row.id)}
                                title="Delete BOP"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* =========================================
              ACTIONS
          ========================================== */}

          <div className="costing-entry-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostingEntryForm;
