
"use strict";

// ======================================
// SINGLETON PATTERN
// ======================================

class Library {
    static key = Symbol("Library");
    static instance = null;

    constructor(key) {
        if (key !== Library.key) {
            throw new Error("Use Library.getInstance()");
        }
        this.books = [];
    }

    static getInstance() {
        if (!Library.instance) {
            Library.instance = new Library(Library.key);
        }
        return Library.instance;
    }

    add(book) {
        if (this.books.some(b => b.id === book.id)) {
            return false;
        }
        this.books.push(book);
        return true;
    }

    getAll() {
        return [...this.books];
    }

    search(query) {
        const q = String(query).trim().toLowerCase();

        return this.books.filter(book =>
            String(book.id) === q ||
            book.title.toLowerCase().includes(q) ||
            book.author.toLowerCase().includes(q)
        );
    }

    update(id, title, author) {
        const book = this.books.find(b => b.id === id);

        if (!book) return false;

        book.title = title;
        book.author = author;
        return true;
    }

    delete(id) {
        const index = this.books.findIndex(b => b.id === id);

        if (index === -1) return false;

        this.books.splice(index, 1);
        return true;
    }
}

const library = Library.getInstance();


// ======================================
// ADAPTER PATTERN
// ======================================

class LegacyBook {
    constructor(bookCode, bookName, writer) {
        this.bookCode = bookCode;
        this.bookName = bookName;
        this.writer = writer;
    }
}

class BookAdapter {
    constructor(legacyBook) {
        this.legacyBook = legacyBook;
    }

    convert() {
        return {
            id: Number(this.legacyBook.bookCode),
            title: this.legacyBook.bookName,
            author: this.legacyBook.writer
        };
    }
}

// Sample books imported through the Adapter.
const oldBooks = [
    new LegacyBook(101, "Java Programming", "James Gosling"),
    new LegacyBook(102, "Python Basics", "Guido van Rossum"),
    new LegacyBook(103, "Web Development", "Jon Duckett")
];

oldBooks.forEach(oldBook => {
    library.add(new BookAdapter(oldBook).convert());
});


// ======================================
// COMMAND PATTERN
// ======================================

class AddBookCommand {
    constructor(book) {
        this.book = book;
    }

    execute() {
        return library.add(this.book);
    }
}

class ViewBooksCommand {
    execute() {
        return library.getAll();
    }
}

class SearchBookCommand {
    constructor(query) {
        this.query = query;
    }

    execute() {
        return library.search(this.query);
    }
}

class UpdateBookCommand {
    constructor(id, title, author) {
        this.id = id;
        this.title = title;
        this.author = author;
    }

    execute() {
        return library.update(this.id, this.title, this.author);
    }
}

class DeleteBookCommand {
    constructor(id) {
        this.id = id;
    }

    execute() {
        return library.delete(this.id);
    }
}

class CommandInvoker {
    execute(command) {
        return command.execute();
    }
}

const invoker = new CommandInvoker();


// ======================================
// HELPER FUNCTIONS
// ======================================

function showMessage(text) {
    document.getElementById("message").textContent = text;
}

function clearMessage() {
    showMessage("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getBookInput() {
    const idText = document.getElementById("bookId").value.trim();
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const id = Number(idText);

    if (!idText || !Number.isSafeInteger(id) || id <= 0 ||
        !title || !author) {
        showMessage("Enter a valid ID, title and author.");
        return null;
    }

    return { id, title, author };
}

function renderBooks(books) {
    const table = document.getElementById("bookTable");

    if (books.length === 0) {
        table.innerHTML =
            '<tr><td colspan="3">No books found.</td></tr>';
        return;
    }

    table.innerHTML = books.map(book => `
        <tr>
            <td>${escapeHTML(book.id)}</td>
            <td>${escapeHTML(book.title)}</td>
            <td>${escapeHTML(book.author)}</td>
        </tr>
    `).join("");
}

function refreshBooks() {
    renderBooks(invoker.execute(new ViewBooksCommand()));
}


// ======================================
// ADD BOOK
// ======================================

document.getElementById("bookForm").addEventListener("submit", event => {
    event.preventDefault();

    const book = getBookInput();
    if (!book) return;

    const success = invoker.execute(new AddBookCommand(book));

    if (success) {
        showMessage("Book added successfully!");
        document.getElementById("bookForm").reset();
        refreshBooks();
    } else {
        showMessage("Book ID already exists!");
    }
});


// ======================================
// VIEW BOOKS
// ======================================

function viewBooks() {
    refreshBooks();
    showMessage("All books displayed.");
}


// ======================================
// SEARCH BOOK
// ======================================

function searchBook() {
    const id = document.getElementById("bookId").value.trim();
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();

    const query = id || title || author;

    if (!query) {
        showMessage("Enter an ID, title or author to search.");
        return;
    }

    const results = invoker.execute(new SearchBookCommand(query));

    renderBooks(results);
    showMessage(results.length + " matching book(s) found.");
}


// ======================================
// UPDATE BOOK
// ======================================

function updateBook() {
    const book = getBookInput();
    if (!book) return;

    const success = invoker.execute(
        new UpdateBookCommand(book.id, book.title, book.author)
    );

    if (success) {
        showMessage("Book updated successfully!");
        refreshBooks();
    } else {
        showMessage("Book ID not found!");
    }
}


// ======================================
// DELETE BOOK
// ======================================

function deleteBook() {
    const idText = document.getElementById("bookId").value.trim();
    const id = Number(idText);

    if (!idText || !Number.isSafeInteger(id) || id <= 0) {
        showMessage("Enter a valid Book ID to delete.");
        return;
    }

    const success = invoker.execute(new DeleteBookCommand(id));

    if (success) {
        showMessage("Book deleted successfully!");
    } else {
        showMessage("Book ID not found!");
    }

    refreshBooks();
}


// ======================================
// INITIAL DISPLAY
// ======================================

refreshBooks();
