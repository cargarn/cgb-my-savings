import { parseSavings, type SavingsData } from "./model";
import { AppError, translate, type Language } from "./i18n";

export interface SavingsFile {
  name: string;
  save(data: SavingsData): Promise<void>;
}

export interface FileRepository {
  supported: boolean;
  open(): Promise<{ data: SavingsData; file: SavingsFile }>;
  create(data: SavingsData): Promise<SavingsFile>;
}

interface WritableFile {
  write(text: string): Promise<void>;
  close(): Promise<void>;
}

export interface JsonFileHandle {
  name: string;
  getFile(): Promise<{ text(): Promise<string> }>;
  createWritable(): Promise<WritableFile>;
}

interface FilePickerOptions {
  types: { description: string; accept: Record<string, string[]> }[];
  excludeAcceptAllOption: boolean;
}

interface PickerWindow {
  showOpenFilePicker?: (
    options: FilePickerOptions & { multiple: boolean },
  ) => Promise<JsonFileHandle[]>;
  showSaveFilePicker?: (
    options: FilePickerOptions & { suggestedName: string },
  ) => Promise<JsonFileHandle>;
}

const fileTypes: FilePickerOptions = {
  types: [
    {
      description: "cgb-my-savings JSON",
      accept: { "application/json": [".json"] },
    },
  ],
  excludeAcceptAllOption: true,
};

function serialize(data: SavingsData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function connectedFile(
  handle: JsonFileHandle,
  initialText: string,
): SavingsFile {
  let expectedText = initialText;
  return {
    name: handle.name,
    async save(data) {
      const currentText = await (await handle.getFile()).text();
      if (currentText !== expectedText) {
        throw new AppError("errorExternalChange");
      }
      const nextText = serialize(data);
      const writer = await handle.createWritable();
      await writer.write(nextText);
      await writer.close();
      expectedText = nextText;
    },
  };
}

export function browserFiles(): FileRepository {
  const pickers: Window & PickerWindow = window;
  return {
    supported: Boolean(
      pickers.showOpenFilePicker && pickers.showSaveFilePicker,
    ),
    async open() {
      if (!pickers.showOpenFilePicker) throw new AppError("errorBrowser");
      const [handle] = await pickers.showOpenFilePicker({
        ...fileTypes,
        multiple: false,
      });
      if (!handle) throw new AppError("errorNoFile");
      const text = await (await handle.getFile()).text();
      return { data: parseSavings(text), file: connectedFile(handle, text) };
    },
    async create(data) {
      if (!pickers.showSaveFilePicker) throw new AppError("errorBrowser");
      const handle = await pickers.showSaveFilePicker({
        ...fileTypes,
        suggestedName: "savings.json",
      });
      const initialText = await (await handle.getFile()).text();
      const file = connectedFile(handle, initialText);
      await file.save(data);
      return file;
    },
  };
}

export function isCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function errorMessage(
  error: unknown,
  language: Language = "en",
): string {
  if (error instanceof AppError) return translate(language, error.key);
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError")
      return translate(language, "errorPermission");
    if (error.name === "NotFoundError")
      return translate(language, "errorFileMissing");
    if (error.name === "QuotaExceededError")
      return translate(language, "errorDiskSpace");
  }
  if (error instanceof Error)
    return translate(language, "errorOperationDetails", {
      details: error.message,
    });
  return translate(language, "errorOperation");
}
