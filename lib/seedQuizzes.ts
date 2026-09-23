import type { QuizInput, QuizQuestionItem } from "./types";

function q(
  text: string,
  options: string[],
  correctIndex: number,
  difficulty: QuizQuestionItem["difficulty"],
  points = 1000
): QuizQuestionItem {
  return {
    id: crypto.randomUUID(),
    text,
    options,
    correctIndex,
    timeLimit: 20,
    points,
    difficulty,
  };
}

type SeedQuiz = Omit<QuizInput, "ownerId" | "ownerName">;

export const SEED_QUIZZES: SeedQuiz[] = [
  {
    title: "Python Basics",
    description: "Core Python syntax, data types, and control flow — for anyone just getting started.",
    language: "English",
    category: "Python",
    difficulty: "Beginner",
    visibility: "public",
    questions: [
      q("What keyword defines a function in Python?", ["func", "def", "function", "lambda"], 1, "easy"),
      q("Which data type is immutable in Python?", ["List", "Dictionary", "Tuple", "Set"], 2, "easy"),
      q('What does len("hello") return?', ["4", "5", "6", "Error"], 1, "easy"),
      q("Which symbol starts a comment in Python?", ["//", "#", "--", "/*"], 1, "easy"),
      q("What is the output of print(3 // 2)?", ["1.5", "1", "2", "Error"], 1, "medium"),
      q("Which method adds an item to the end of a list?", ["list.add()", "list.append()", "list.push()", "list.insert()"], 1, "easy"),
      q("What does the 'self' keyword refer to inside a class method?", ["The class itself", "The current instance", "A global variable", "The parent class"], 1, "medium"),
      q("What will range(5) produce when converted to a list?", ["[1,2,3,4,5]", "[0,1,2,3,4]", "[0,1,2,3,4,5]", "[5,4,3,2,1]"], 1, "medium"),
    ],
  },
  {
    title: "Python: Next Level",
    description: "Decorators, comprehensions, generators, and other things that separate intermediate from advanced Python.",
    language: "English",
    category: "Python",
    difficulty: "Advanced",
    visibility: "public",
    questions: [
      q("What does a Python decorator do?", ["Deletes a function", "Wraps a function to extend its behavior", "Converts a function to a class", "Compiles Python to C"], 1, "hard"),
      q("Which of these creates a generator, not a list?", ["[x for x in range(10)]", "(x for x in range(10))", "{x for x in range(10)}", "list(range(10))"], 1, "medium"),
      q("What does the GIL (Global Interpreter Lock) prevent?", ["Multiple files from being imported", "True parallel execution of Python bytecode across threads", "Variable name collisions", "Memory leaks"], 1, "hard"),
      q("What is the output of [1,2,3] + [4,5]?", ["[1,2,3,4,5]", "Error", "[5,7]", "[1,2,3,[4,5]]"], 0, "easy"),
      q("Which built-in lets you iterate two lists in parallel?", ["zip()", "map()", "enumerate()", "pair()"], 0, "medium"),
      q("What does @staticmethod mean on a class method?", ["It needs 'self'", "It can be called without creating an instance and without access to the class", "It runs automatically at import time", "It caches its result forever"], 1, "hard"),
      q("What's the difference between a list and a tuple, primarily?", ["Tuples can hold more data types", "Tuples are immutable, lists are mutable", "Lists are faster to read", "There is no difference"], 1, "medium"),
    ],
  },
  {
    title: "C Programming Fundamentals",
    description: "Pointers, memory, and the basics every C programmer needs cold.",
    language: "English",
    category: "C",
    difficulty: "Beginner",
    visibility: "public",
    questions: [
      q("Which function is the entry point of a C program?", ["start()", "main()", "init()", "run()"], 1, "easy"),
      q("What does the '&' operator do before a variable name?", ["Bitwise AND", "Gets the address of the variable", "Declares a reference type", "Multiplies by 2"], 1, "medium"),
      q("Which header is needed for printf()?", ["<string.h>", "<stdlib.h>", "<stdio.h>", "<math.h>"], 2, "easy"),
      q("What is the size of an int typically on a 32-bit system?", ["1 byte", "2 bytes", "4 bytes", "8 bytes"], 2, "medium"),
      q("What does malloc() do?", ["Frees memory", "Allocates memory dynamically", "Declares a constant", "Starts a new thread"], 1, "medium"),
      q("Which loop always runs at least once?", ["for", "while", "do-while", "foreach"], 2, "easy"),
      q("What symbol ends most C statements?", [".", ";", ":", ","], 1, "easy"),
    ],
  },
  {
    title: "C++ Object-Oriented Concepts",
    description: "Classes, inheritance, and the C++-specific features that build on plain C.",
    language: "English",
    category: "C++",
    difficulty: "Intermediate",
    visibility: "public",
    questions: [
      q("Which keyword is used to create a class in C++?", ["struct", "class", "object", "type"], 1, "easy"),
      q("What is a constructor?", ["A function that deletes an object", "A special function called when an object is created", "A type of loop", "A memory address"], 1, "easy"),
      q("What does 'virtual' mean for a member function?", ["It can't be called", "It enables runtime polymorphism via overriding", "It's private by default", "It runs only once"], 1, "hard"),
      q("Which operator is overloaded to print custom objects with cout?", ["==", "<<", "->", "::"], 1, "medium"),
      q("What is the default access specifier for a C++ class?", ["public", "private", "protected", "internal"], 1, "medium"),
      q("What does 'new' do in C++?", ["Declares a variable", "Allocates memory on the heap", "Starts a new scope", "Creates a namespace"], 1, "medium"),
      q("Multiple inheritance means a class can:", ["Have multiple constructors", "Inherit from more than one base class", "Be instantiated multiple times", "Override main()"], 1, "hard"),
    ],
  },
  {
    title: "Java Essentials",
    description: "JVM basics, syntax, and object-oriented fundamentals in Java.",
    language: "English",
    category: "Java",
    difficulty: "Beginner",
    visibility: "public",
    questions: [
      q("What must every Java application have?", ["A constructor", "A main() method", "An interface", "A package"], 1, "easy"),
      q("Which keyword is used to inherit a class in Java?", ["implements", "extends", "inherits", "super"], 1, "easy"),
      q("What does JVM stand for?", ["Java Virtual Machine", "Java Verified Module", "Just Virtual Memory", "Java Variable Method"], 0, "easy"),
      q("Which of these is NOT a Java primitive type?", ["int", "boolean", "String", "double"], 2, "medium"),
      q("What does 'public static void main' mean by 'static'?", ["Runs only once ever", "Belongs to the class, not an instance", "Can't be changed", "Is private"], 1, "medium"),
      q("Which keyword prevents a class from being subclassed?", ["static", "final", "private", "const"], 1, "medium"),
      q("What is used to handle exceptions in Java?", ["if/else", "try/catch", "switch/case", "goto"], 1, "easy"),
    ],
  },
  {
    title: "General Knowledge Starter",
    description: "A broad mix of world facts, history, and science to warm up with.",
    language: "English",
    category: "General Knowledge",
    difficulty: "Beginner",
    visibility: "public",
    questions: [
      q("What is the capital of Japan?", ["Seoul", "Beijing", "Tokyo", "Bangkok"], 2, "easy"),
      q("How many continents are there on Earth?", ["5", "6", "7", "8"], 2, "easy"),
      q("Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Saturn"], 1, "easy"),
      q("Who wrote the play 'Romeo and Juliet'?", ["Charles Dickens", "William Shakespeare", "Mark Twain", "Leo Tolstoy"], 1, "easy"),
      q("What is the largest ocean on Earth?", ["Atlantic", "Indian", "Arctic", "Pacific"], 3, "medium"),
      q("In which year did India gain independence?", ["1945", "1947", "1950", "1952"], 1, "medium"),
      q("What gas do plants primarily absorb from the air?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2, "easy"),
      q("What is the chemical symbol for gold?", ["Go", "Gd", "Au", "Ag"], 2, "medium"),
    ],
  },
];
