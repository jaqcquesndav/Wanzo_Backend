"""
Simple text splitter to replace LangChain's RecursiveCharacterTextSplitter.
Splits text into chunks with configurable size and overlap.
"""
from typing import List


class Document:
    """Simple document container."""
    def __init__(self, page_content: str, metadata: dict = None):
        self.page_content = page_content
        self.metadata = metadata or {}


class RecursiveCharacterTextSplitter:
    """
    Simple text splitter that divides text into chunks with overlap.
    Compatible replacement for LangChain's RecursiveCharacterTextSplitter.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, **kwargs):
        """
        Initialize the text splitter.
        
        Args:
            chunk_size: Maximum size of each chunk in characters
            chunk_overlap: Number of overlapping characters between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def split_text(self, text: str) -> List[str]:
        """
        Split text into chunks.
        
        Args:
            text: Text to split
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            # Calculate end position for this chunk
            end = start + self.chunk_size
            
            # If this is not the last chunk, try to break at a good position
            if end < text_length:
                # Try to break at paragraph, then sentence, then word boundary
                chunk = text[start:end]
                
                # Look for paragraph break
                last_paragraph = chunk.rfind('\n\n')
                if last_paragraph > self.chunk_size // 2:
                    end = start + last_paragraph + 2
                else:
                    # Look for sentence break
                    last_sentence = max(
                        chunk.rfind('. '),
                        chunk.rfind('! '),
                        chunk.rfind('? ')
                    )
                    if last_sentence > self.chunk_size // 2:
                        end = start + last_sentence + 2
                    else:
                        # Look for word break
                        last_space = chunk.rfind(' ')
                        if last_space > self.chunk_size // 2:
                            end = start + last_space + 1
            
            # Extract chunk
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position for next chunk (with overlap)
            start = end - self.chunk_overlap
            
            # Ensure we make progress
            if start <= chunks[-1] if chunks else 0:
                start = end
        
        return chunks
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """
        Split documents into smaller chunks.
        
        Args:
            documents: List of Document objects to split
            
        Returns:
            List of smaller Document objects
        """
        split_docs = []
        
        for doc in documents:
            chunks = self.split_text(doc.page_content)
            
            for i, chunk in enumerate(chunks):
                # Preserve original metadata and add chunk info
                metadata = doc.metadata.copy()
                metadata['chunk'] = i
                metadata['total_chunks'] = len(chunks)
                
                split_docs.append(Document(
                    page_content=chunk,
                    metadata=metadata
                ))
        
        return split_docs
    
    def create_documents(self, texts: List[str], metadatas: List[dict] = None) -> List[Document]:
        """
        Create documents from texts and split them.
        
        Args:
            texts: List of texts to convert to documents
            metadatas: Optional list of metadata dicts for each text
            
        Returns:
            List of Document objects
        """
        if metadatas is None:
            metadatas = [{} for _ in texts]
        
        documents = [
            Document(page_content=text, metadata=metadata)
            for text, metadata in zip(texts, metadatas)
        ]
        
        return self.split_documents(documents)
