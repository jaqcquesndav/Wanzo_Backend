import asyncio
import time
import traceback
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import uuid

class OrchestrationAgent:
    """
    Agent responsable de la coordination et de l'orchestration des autres agents
    pour optimiser le flux de traitement.
    """
    def __init__(self):
        """Initialise l'agent d'orchestration."""
        print("OrchestrationAgent initialized")
        self.tasks = {}
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.pipeline_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_processing_time": 0
        }

    async def process_document(self, file=None, prompt=None, intention=None, entities=None):
        """
        Coordonne le traitement d'un document ou d'un prompt texte.
        
        Args:
            file: Fichier à traiter (peut être None si prompt est fourni).
            prompt: Texte à traiter (peut être None si file est fourni).
            intention: Intention spécifiée par l'utilisateur.
            entities: Entités spécifiées extraites par l'NLUAgent.
            
        Returns:
            dict: Résultat du traitement incluant les écritures générées.
        """
        from agents.logic.dde_agent import DDEAgent
        from agents.logic.aa_agent import AAgent
        from agents.logic.ccc_agent import CCCAgent
        
        task_id = str(uuid.uuid4())
        start_time = time.time()
        
        self.tasks[task_id] = {
            "status": "processing",
            "start_time": start_time,
            "type": "prompt" if prompt else "document",
            "progress": 0
        }
        
        try:
            self.pipeline_stats["total_requests"] += 1
            
            # Phase 1: Extraction des données (DDEAgent)
            self.tasks[task_id]["progress"] = 10
            self.tasks[task_id]["current_step"] = "data_extraction"
            
            # Exécution de l'extraction dans un thread pour les opérations I/O
            dde_agent = DDEAgent()
            if file:
                extracted_data = await asyncio.get_event_loop().run_in_executor(
                    self.executor, lambda: dde_agent.process(file)
                )
            else:
                extracted_data = await asyncio.get_event_loop().run_in_executor(
                    self.executor, lambda: dde_agent.process_prompt(prompt)
                )
            
            if 'error' in extracted_data:
                self.tasks[task_id]["status"] = "error"
                self.tasks[task_id]["error"] = extracted_data['error']
                self.pipeline_stats["failed_requests"] += 1
                return {"error": extracted_data['error'], "task_id": task_id}
                
            # Phase 2: Analyse des données (AAgent)
            self.tasks[task_id]["progress"] = 40
            self.tasks[task_id]["current_step"] = "data_analysis"
            
            aa_agent = AAgent()
            analysis_result = await asyncio.get_event_loop().run_in_executor(
                self.executor, lambda: aa_agent.process(intention, entities or {}, extracted_data)
            )
            
            # Phase 3: Vérification de la cohérence et conformité (CCCAgent)
            self.tasks[task_id]["progress"] = 70
            self.tasks[task_id]["current_step"] = "verification"
            
            ccc_agent = CCCAgent()
            verification_results = await asyncio.get_event_loop().run_in_executor(
                self.executor, lambda: ccc_agent.verify(analysis_result.get("proposals", []))
            )
            
            # Phase 4: Finalisation du résultat
            self.tasks[task_id]["progress"] = 100
            self.tasks[task_id]["current_step"] = "completed"
            self.tasks[task_id]["status"] = "completed"
            
            # Calcul du temps de traitement
            end_time = time.time()
            processing_time = end_time - start_time
            self.tasks[task_id]["processing_time"] = processing_time
            
            # Mise à jour des statistiques
            self.pipeline_stats["successful_requests"] += 1
            old_avg = self.pipeline_stats["avg_processing_time"]
            self.pipeline_stats["avg_processing_time"] = (
                (old_avg * (self.pipeline_stats["successful_requests"] - 1) + processing_time) / 
                self.pipeline_stats["successful_requests"]
            )
            
            # Construction du résultat final
            result = {
                "entries": analysis_result.get("proposals", []),
                "verification": verification_results,
                "task_id": task_id,
                "processing_time": processing_time
            }
            
            # Ajout des détails si demandé
            if "details" in analysis_result:
                result["details"] = analysis_result["details"]
                
            return result
            
        except Exception as e:
            error_msg = f"Erreur lors du traitement: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            
            self.tasks[task_id]["status"] = "error"
            self.tasks[task_id]["error"] = str(e)
            self.pipeline_stats["failed_requests"] += 1
            
            return {"error": str(e), "task_id": task_id}

    async def process_batch(self, documents, intention=None):
        """
        Traite un lot de documents en parallèle.
        
        Args:
            documents: Liste de documents à traiter.
            intention: Intention commune à tous les documents.
            
        Returns:
            List[dict]: Liste des résultats pour chaque document.
        """
        tasks = []
        for doc in documents:
            if "file" in doc:
                task = self.process_document(file=doc["file"], intention=intention)
            elif "prompt" in doc:
                task = self.process_document(prompt=doc["prompt"], intention=intention)
            else:
                continue
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results

    def get_task_status(self, task_id):
        """
        Récupère le statut d'une tâche en cours.
        
        Args:
            task_id: ID de la tâche.
            
        Returns:
            dict: Informations sur la tâche.
        """
        if task_id in self.tasks:
            return self.tasks[task_id]
        return {"status": "not_found", "error": "Tâche non trouvée"}

    def get_pipeline_stats(self):
        """
        Récupère les statistiques du pipeline de traitement.
        
        Returns:
            dict: Statistiques du pipeline.
        """
        return self.pipeline_stats

    def cancel_task(self, task_id):
        """
        Tente d'annuler une tâche en cours.
        
        Args:
            task_id: ID de la tâche à annuler.
            
        Returns:
            bool: True si la tâche a été annulée avec succès, False sinon.
        """
        if task_id in self.tasks and self.tasks[task_id]["status"] == "processing":
            self.tasks[task_id]["status"] = "cancelled"
            return True
        return False
