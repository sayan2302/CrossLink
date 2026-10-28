export interface Entity {
  corpId: number;
  corpName: string;
}

export interface PolicyOption {
  polId: number;
  polNo: string;
  dbType?: string;
}

export interface PolicyCard {
  policyId: number;
  policyNumber: string;
  policyHolderName: string;
  policyHolderAddress: string;
  startDate: string;
  endDate: string;
  pihMemberId: string;
  maid: number;
  empCode?: string;
  expMonths: number;
  expDays: number;
  isExpired: boolean;
}

export interface Beneficiary {
  MAID: number;
  BenefUserId: number;
  Name: string;
  Relation: string;
  Gender?: string;
  DOB?: string;
  PIHMemberId?: string;
}

export interface DiagnosisCode {
  code: string;
  description: string;
  groupName?: string;
}

export interface CountryItem {
  countryId?: number;
  countryName: string;
  countryShortName?: string;
  country2DigitCode?: string;
  currency?: string;
  [key: string]: any;
}

export interface BillItem {
  billNo: string;
  amount: string;
  billDate: string;
  doctorName: string;
  clinicAddress: string;
  billType: string;
}

export interface ServiceType {
  chargeTypeId: number;
  name: string;
}

export interface UploadedDoc {
  fileGUID: string;
  fileName: string;
  category: 'DoctorCertificate' | 'Receipt' | 'ListOfMedicine' | 'OtherSupporting';
  fileSize?: number;
  contentType?: string;
  isActive: boolean;
}

export interface BankAccount {
  groupingKey: string;
  data: Record<string, string> | any;
}

export interface BankFormField {
  propName?: string;
  propDisplayName?: string;
  type?: string;
  isMandatory?: boolean;
  mask?: string;
  options?: Array<{ key: string; value: string }>;
  [key: string]: any;
}

export interface ClaimDetailsData {
  claimCategory: string;
  dateOfIncidence: string;
  dateOfTreatment: string;
  symptomStartDate: string;
  countryOfIncidence: string;
  currency: string;
  symptom: string;
  diagnosisText: string;
  icdCode: string;
  totalBillAmount: string;
}
