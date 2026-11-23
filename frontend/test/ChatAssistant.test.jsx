// The AI chat widget: opening it, asking, showing answers and product links,
// sending the conversation history, and handling errors.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import api from "../src/services/api";
import ChatAssistant from "../src/components/ChatAssistant";

vi.mock("../src/services/api", () => ({ default: { post: vi.fn() } }));

const galaxy = { id: 2, name: "Samsung Galaxy S24", price: 899.99, stock: 40 };

function openChat() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ChatAssistant />
    </MemoryRouter>
  );
  return user;
}

async function ask(user, text) {
  await user.type(screen.getByRole("textbox", { name: "Message the shopping assistant" }), text);
  await user.click(screen.getByRole("button", { name: "Send" }));
}

describe("ChatAssistant", () => {
  it("is closed at first and opens with a welcome message", async () => {
    const user = openChat();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ask ai/i }));

    expect(screen.getByText(/I can help you find products/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled(); // nothing typed yet
  });

  it("sends the question and shows the answer with a link to the product", async () => {
    api.post.mockResolvedValue({ data: { reply: "Yes! Samsung Galaxy S24: $899.99", products: [galaxy] } });
    const user = openChat();
    await user.click(screen.getByRole("button", { name: /ask ai/i }));

    await ask(user, "Do you have a Galaxy?");

    expect(screen.getByText("Do you have a Galaxy?")).toBeInTheDocument();
    expect(await screen.findByText("Yes! Samsung Galaxy S24: $899.99")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Samsung Galaxy S24 · 899\.99/ })).toHaveAttribute("href", "/products/2");
    // The welcome message is never sent to the server
    expect(api.post).toHaveBeenCalledWith("/assistant", { message: "Do you have a Galaxy?", history: [] });
  });

  it("marks out-of-stock products in the answer", async () => {
    api.post.mockResolvedValue({ data: { reply: "Samsung Galaxy S24: $899.99", products: [{ ...galaxy, stock: 0 }] } });
    const user = openChat();
    await user.click(screen.getByRole("button", { name: /ask ai/i }));

    await ask(user, "Galaxy?");

    expect(await screen.findByRole("link", { name: /out of stock/ })).toBeInTheDocument();
  });

  it("sends the earlier conversation along, so follow-up questions work", async () => {
    api.post
      .mockResolvedValueOnce({ data: { reply: "We have phones.", products: [] } })
      .mockResolvedValueOnce({ data: { reply: "The cheapest is €499.", products: [] } });
    const user = openChat();
    await user.click(screen.getByRole("button", { name: /ask ai/i }));

    await ask(user, "Do you sell phones?");
    await screen.findByText("We have phones.");
    await ask(user, "Which is cheapest?");
    await screen.findByText("The cheapest is €499.");

    expect(api.post).toHaveBeenLastCalledWith("/assistant", {
      message: "Which is cheapest?",
      history: [
        { role: "user", content: "Do you sell phones?" },
        { role: "assistant", content: "We have phones." },
      ],
    });
  });

  it("shows the server's error message, and doesn't send errors back as history", async () => {
    api.post
      .mockRejectedValueOnce({ response: { data: { message: "The assistant is busy right now." } } })
      .mockResolvedValueOnce({ data: { reply: "Hi again!", products: [] } });
    const user = openChat();
    await user.click(screen.getByRole("button", { name: /ask ai/i }));

    await ask(user, "Hello?");
    expect(await screen.findByText("The assistant is busy right now.")).toBeInTheDocument();

    await ask(user, "Hello again?");
    await screen.findByText("Hi again!");

    expect(api.post).toHaveBeenLastCalledWith("/assistant", {
      message: "Hello again?",
      history: [{ role: "user", content: "Hello?" }],
    });
  });

  it("shows 'typing…' and blocks new messages while waiting for the answer", async () => {
    let answer;
    api.post.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
    const user = openChat();
    await user.click(screen.getByRole("button", { name: /ask ai/i }));

    await ask(user, "Hi");

    expect(screen.getByText("Assistant is typing…")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Message the shopping assistant" })).toBeDisabled();

    answer({ data: { reply: "Hello!", products: [] } });
    expect(await screen.findByText("Hello!")).toBeInTheDocument();
    expect(screen.queryByText("Assistant is typing…")).not.toBeInTheDocument();
  });
});
