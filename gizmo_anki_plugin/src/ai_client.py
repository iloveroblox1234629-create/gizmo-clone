"""AI client for generating flashcards and providing tutor feedback."""
import json
import re
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import google.generativeai as genai
    from google.generativeai.types import GenerationConfig
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from . import config


class AIClientError(Exception):
    """Base exception for AI client errors."""
    pass


class BaseAIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    def generate_flashcards(self, text: str, count: int = 5) -> List[Dict[str, str]]:
        """Generate flashcard data from text."""
        pass

    @abstractmethod
    def grade_answer(self, question: str, correct_answer: str,
                     user_answer: str) -> Dict[str, any]:
        """Grade user answer semantically."""
        pass


class OpenAIClient(BaseAIProvider):
    """OpenAI GPT client."""

    def __init__(self, api_key: str, model: str = "gpt-4"):
        if not OPENAI_AVAILABLE:
            raise ImportError("openai package not installed")
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model

    def generate_flashcards(self, text: str, count: int = 5) -> List[Dict[str, str]]:
        """Generate flashcards using GPT."""
        prompt = f"""
        Extract {count} key concepts from the following text and create Q&A flashcards.

        Return a JSON array of objects with 'front' (question) and 'back' (answer) fields.
        Format as pure JSON, no markdown.

        Text: {text[:4000]}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful study assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            content = response.choices[0].message.content.strip()
            # Clean markdown code fences if present
            content = re.sub(r'^```json\s*|\s*```$', '', content, flags=re.MULTILINE)
            cards = json.loads(content)
            return cards if isinstance(cards, list) else []
        except json.JSONDecodeError as e:
            raise AIClientError(f"Failed to parse AI response: {e}")
        except Exception as e:
            raise AIClientError(f"OpenAI error: {e}")

    def grade_answer(self, question: str, correct_answer: str, user_answer: str) -> Dict[str, any]:
        """Grade answer using semantic similarity."""
        prompt = f"""
        Question: {question}
        Correct Answer: {correct_answer}
        User Answer: {user_answer}

        Grade this answer on:
        1. Accuracy (0-100): How correct is the content?
        2. Completeness (0-100): Is the answer complete?
        3. Conciseness (0-100): Is it appropriately concise?

        Return JSON: {{"accuracy": 0-100, "completeness": 0-100, "conciseness": 0-100,
                       "feedback": "brief explanation", "correct": true/false}}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a strict but fair tutor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            content = response.choices[0].message.content.strip()
            content = re.sub(r'^```json\s*|\s*```$', '', content, flags=re.MULTILINE)
            result = json.loads(content)
            result["semantic_score"] = (result["accuracy"] + result["completeness"] + result["conciseness"]) / 3
            return result
        except Exception as e:
            raise AIClientError(f"Grading failed: {e}")


class GeminiClient(BaseAIProvider):
    """Google Gemini client."""

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        if not GEMINI_AVAILABLE:
            raise ImportError("google-generativeai package not installed")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

    def generate_flashcards(self, text: str, count: int = 5) -> List[Dict[str, str]]:
        """Generate flashcards using Gemini."""
        prompt = f"""
        Extract {count} key concepts from the following text and create Q&A flashcards.

        Return a JSON array of objects with 'front' (question) and 'back' (answer) fields.
        Format as pure JSON, no markdown, no extra text.

        Text: {text[:4000]}
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(temperature=0.7)
            )
            content = response.text.strip()
            content = re.sub(r'^```json\s*|\s*```$', '', content, flags=re.MULTILINE)
            cards = json.loads(content)
            return cards if isinstance(cards, list) else []
        except json.JSONDecodeError as e:
            raise AIClientError(f"Failed to parse AI response: {e}")
        except Exception as e:
            raise AIClientError(f"Gemini error: {e}")

    def grade_answer(self, question: str, correct_answer: str, user_answer: str) -> Dict[str, any]:
        """Grade answer using semantic similarity."""
        prompt = f"""
        Question: {question}
        Correct Answer: {correct_answer}
        User Answer: {user_answer}

        Grade this answer on:
        1. Accuracy (0-100): How correct is the content?
        2. Completeness (0-100): Is the answer complete?
        3. Conciseness (0-100): Is it appropriately concise?

        Return JSON only: {{"accuracy": 0-100, "completeness": 0-100, "conciseness": 0-100,
                       "feedback": "brief explanation", "correct": true/false}}
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(temperature=0.3)
            )
            content = response.text.strip()
            content = re.sub(r'^```json\s*|\s*```$', '', content, flags=re.MULTILINE)
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)

            result = json.loads(content)
            result["semantic_score"] = (result["accuracy"] + result["completeness"] + result["conciseness"]) / 3
            return result
        except Exception as e:
            raise AIClientError(f"Grading failed: {e}")


def get_client() -> BaseAIProvider:
    """Get configured AI client."""
    cfg = config.load_config()
    model = cfg.get("ai_model", "gemini")

    if model == "gemini":
        key = cfg.get("gemini_api_key", "")
        if not key:
            raise AIClientError("Gemini API key not configured")
        return GeminiClient(api_key=key)
    elif model in ("gpt-4", "gpt-3.5-turbo"):
        key = cfg.get("openai_api_key", "")
        if not key:
            raise AIClientError("OpenAI API key not configured")
        return OpenAIClient(api_key=key, model=model)
    else:
        raise AIClientError(f"Unknown AI model: {model}")


def generate_from_text(text: str, count: int = 5) -> Tuple[bool, List[Dict], str]:
    """Generate flashcards from text. Returns (success, cards, error)."""
    try:
        client = get_client()
        cards = client.generate_flashcards(text, count)
        return True, cards, ""
    except Exception as e:
        return False, [], str(e)


def grade_answer(question: str, correct: str, user: str) -> Tuple[bool, Dict, str]:
    """Grade an answer. Returns (success, result, error)."""
    if not config.get("tutor_enabled"):
        return True, {"semantic_score": 100.0, "correct": True, "feedback": "Tutor disabled"}, ""

    try:
        client = get_client()
        result = client.grade_answer(question, correct, user)
        return True, result, ""
    except Exception as e:
        return False, {}, str(e)