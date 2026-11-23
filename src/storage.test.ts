import { describe, expect, it } from "vitest";
import { connectedFile, type JsonFileHandle } from "./storage";
import { sampleData } from "./test-fixtures";

function diskFile(initial: string, closeError = false) {
  let contents = initial;
  const handle: JsonFileHandle = {
    name: "savings.json",
    async getFile() {
      return { text: async () => contents };
    },
    async createWritable() {
      let pending = contents;
      return {
        async write(text) {
          pending = text;
        },
        async close() {
          if (closeError) throw new Error("Disk is full");
          contents = pending;
        },
      };
    },
  };
  return {
    handle,
    read: () => contents,
    externalEdit: (text: string) => {
      contents = text;
    },
  };
}

describe("JSON file persistence", () => {
  it("commits data to the selected file and supports subsequent saves", async () => {
    const disk = diskFile("{}");
    const file = connectedFile(disk.handle, "{}");
    const data = sampleData();
    await file.save(data);
    expect(JSON.parse(disk.read())).toEqual(data);
    data.snapshots[0].predicted = 12_345;
    await file.save(data);
    expect(JSON.parse(disk.read()).snapshots[0].predicted).toBe(12_345);
  });

  it("refuses to overwrite external changes", async () => {
    const disk = diskFile("{}");
    const file = connectedFile(disk.handle, "{}");
    disk.externalEdit('{"external":"change"}');
    await expect(file.save(sampleData())).rejects.toThrow(
      "changed outside this app",
    );
    expect(disk.read()).toBe('{"external":"change"}');
  });

  it("reports failed commits without claiming the new data was saved", async () => {
    const disk = diskFile("{}", true);
    const file = connectedFile(disk.handle, "{}");
    await expect(file.save(sampleData())).rejects.toThrow("Disk is full");
    expect(disk.read()).toBe("{}");
  });
});
