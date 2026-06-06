import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor.js";

describe("MarkdownEditor", () => {
  it("renders textarea with placeholder", () => {
    const onChange = vi.fn();
    render(
      <MarkdownEditor
        value=""
        onChange={onChange}
        placeholder="Write here..."
      />,
    );
    expect(screen.getByPlaceholderText("Write here...")).toBeInTheDocument();
  });

  it("calls onChange when textarea is edited", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(onChange).toHaveBeenCalledWith("Hello world");
  });

  it("shows preview when switching to preview mode", () => {
    render(<MarkdownEditor value="**bold text**" onChange={() => {}} />);
    fireEvent.click(screen.getByText("プレビュー"));
    // In preview mode, the markdown is rendered as bold text
    expect(screen.getByText("bold text")).toBeInTheDocument();
  });

  it("displays char count in status bar", () => {
    render(<MarkdownEditor value="Hello" onChange={() => {}} />);
    expect(screen.getByText(/5文字/)).toBeInTheDocument();
  });

  it("toolbar Bold button exists", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
  });

  it("toolbar Italic button exists", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle("Italic")).toBeInTheDocument();
  });

  it("toolbar H2 button exists", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle("H2")).toBeInTheDocument();
  });

  it("toolbar Code button exists", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle("Code")).toBeInTheDocument();
  });

  it("toolbar Link button exists", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle("Link")).toBeInTheDocument();
  });

  it("toolbar Image button exists", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle("Image")).toBeInTheDocument();
  });

  it("toolbar List button exists", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle("List")).toBeInTheDocument();
  });

  it("displays word count in status bar", () => {
    render(<MarkdownEditor value="Hello world" onChange={() => {}} />);
    expect(screen.getByText(/約2語/)).toBeInTheDocument();
  });

  it("displays Markdown label in status bar", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByText("Markdown")).toBeInTheDocument();
  });

  it("renders in edit mode by default showing textarea", () => {
    render(<MarkdownEditor value="test content" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows 編集 pane selector button", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByText("編集")).toBeInTheDocument();
  });

  it("shows 分割 pane selector button", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByText("分割")).toBeInTheDocument();
  });

  it("shows プレビュー pane selector button", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByText("プレビュー")).toBeInTheDocument();
  });

  it("hides textarea in preview mode", () => {
    render(<MarkdownEditor value="content" onChange={() => {}} />);
    fireEvent.click(screen.getByText("プレビュー"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows both panes in split mode", () => {
    render(<MarkdownEditor value="content" onChange={() => {}} />);
    fireEvent.click(screen.getByText("分割"));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    // preview area should also be present
    expect(screen.getByTestId("preview-pane")).toBeInTheDocument();
  });

  it("shows 0文字 for empty value", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(screen.getByText(/0文字/)).toBeInTheDocument();
  });
});
