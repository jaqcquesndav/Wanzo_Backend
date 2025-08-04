#!/bin/bash

# Script de validation du système Adha AI robuste
# Vérifie la santé de tous les composants et la compatibilité

set -e

echo "🚀 Validation du système Adha AI Service - Robuste et Compatible"
echo "================================================================="

# Couleurs pour les outputs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction pour print avec couleur
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $message"
        ((TESTS_PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC}: $message"
        ((TESTS_FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠ WARN${NC}: $message"
    else
        echo -e "${BLUE}ℹ INFO${NC}: $message"
    fi
}

# Fonction pour tester HTTP endpoint
test_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-10}
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" | grep -q "$expected_status"; then
        return 0
    else
        return 1
    fi
}

# Fonction pour tester une connexion TCP
test_tcp_connection() {
    local host=$1
    local port=$2
    local timeout=${3:-5}
    
    if timeout $timeout bash -c "</dev/tcp/$host/$port"; then
        return 0
    else
        return 1
    fi
}

echo -e "\n${BLUE}1. Vérification de l'infrastructure${NC}"
echo "-----------------------------------"

# Test PostgreSQL
if test_tcp_connection localhost 5432 5; then
    print_status "PASS" "PostgreSQL est accessible sur le port 5432"
else
    print_status "FAIL" "PostgreSQL n'est pas accessible"
fi

# Test Kafka
if test_tcp_connection localhost 9092 5; then
    print_status "PASS" "Kafka est accessible sur le port 9092"
else
    print_status "FAIL" "Kafka n'est pas accessible"
fi

# Test Zookeeper
if test_tcp_connection localhost 2181 5; then
    print_status "PASS" "Zookeeper est accessible sur le port 2181"
else
    print_status "FAIL" "Zookeeper n'est pas accessible"
fi

echo -e "\n${BLUE}2. Vérification des services${NC}"
echo "-----------------------------"

# Test Adha AI Service
if test_http_endpoint "http://localhost:8002/health" 200 10; then
    print_status "PASS" "Adha AI Service répond sur le port 8002"
else
    print_status "FAIL" "Adha AI Service ne répond pas"
fi

# Test métriques Prometheus
if test_http_endpoint "http://localhost:9470/metrics" 200 5; then
    print_status "PASS" "Métriques Prometheus disponibles"
else
    print_status "FAIL" "Métriques Prometheus non disponibles"
fi

# Test Gestion Commerciale (si démarré)
if test_http_endpoint "http://localhost:3000/health" 200 5; then
    print_status "PASS" "Service Gestion Commerciale répond"
else
    print_status "WARN" "Service Gestion Commerciale non démarré ou inaccessible"
fi

# Test Accounting Service (si démarré)
if test_http_endpoint "http://localhost:3001/health" 200 5; then
    print_status "PASS" "Service Accounting répond"
else
    print_status "WARN" "Service Accounting non démarré ou inaccessible"
fi

# Test Portfolio Institution Service (si démarré)
if test_http_endpoint "http://localhost:3002/health" 200 5; then
    print_status "PASS" "Service Portfolio Institution répond"
else
    print_status "WARN" "Service Portfolio Institution non démarré ou inaccessible"
fi

echo -e "\n${BLUE}3. Vérification de la configuration Kafka${NC}"
echo "-------------------------------------------"

# Vérifier les topics Kafka
echo "Vérification des topics Kafka..."
if docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092 > /dev/null 2>&1; then
    print_status "PASS" "Connexion aux topics Kafka réussie"
    
    # Vérifier les topics spécifiques
    topics=$(docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092 2>/dev/null)
    
    expected_topics=(
        "commerce.operation.created"
        "accounting.journal.entry"
        "accounting.journal.status"
        "portfolio.analysis.request"
        "portfolio.analysis.response"
        "adha-ai-events"
    )
    
    for topic in "${expected_topics[@]}"; do
        if echo "$topics" | grep -q "$topic"; then
            print_status "PASS" "Topic '$topic' existe"
        else
            print_status "WARN" "Topic '$topic' n'existe pas (sera créé automatiquement)"
        fi
    done
else
    print_status "FAIL" "Impossible de lister les topics Kafka"
fi

echo -e "\n${BLUE}4. Test de connectivité base de données${NC}"
echo "-------------------------------------------"

# Test connexion PostgreSQL pour Adha AI
if docker exec kiota-postgres psql -U postgres -d adha_ai_db -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "PASS" "Base de données adha_ai_db accessible"
else
    print_status "FAIL" "Base de données adha_ai_db inaccessible"
fi

echo -e "\n${BLUE}5. Test des fonctionnalités Adha AI${NC}"
echo "------------------------------------"

# Test endpoint de santé détaillé
health_response=$(curl -s "http://localhost:8002/api/health/detailed" 2>/dev/null || echo "{}")

if echo "$health_response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    print_status "PASS" "Santé détaillée du service: healthy"
elif echo "$health_response" | jq -e '.status == "degraded"' > /dev/null 2>&1; then
    print_status "WARN" "Santé détaillée du service: degraded"
else
    print_status "FAIL" "Impossible d'obtenir le statut de santé détaillé"
fi

# Test du consumer Kafka
consumer_status=$(curl -s "http://localhost:8002/api/kafka/consumer/status" 2>/dev/null || echo "{}")

if echo "$consumer_status" | jq -e '.is_running == true' > /dev/null 2>&1; then
    print_status "PASS" "Consumer Kafka unifié en fonctionnement"
else
    print_status "FAIL" "Consumer Kafka unifié non opérationnel"
fi

echo -e "\n${BLUE}6. Test de compatibilité des messages${NC}"
echo "------------------------------------"

# Test de standardisation des messages
test_payload='{
    "id": "test-validation-123",
    "type": "SALE",
    "amountCdf": 1000,
    "description": "Test de validation",
    "companyId": "test-company",
    "date": "'$(date -Iseconds)'"
}'

echo "Test de traitement d'une opération commerciale..."
response=$(curl -s -X POST "http://localhost:8002/api/test/process-operation" \
    -H "Content-Type: application/json" \
    -d "$test_payload" 2>/dev/null || echo '{"error": "connection_failed"}')

if echo "$response" | jq -e '.status == "success"' > /dev/null 2>&1; then
    print_status "PASS" "Traitement d'opération commerciale réussi"
elif echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    error_msg=$(echo "$response" | jq -r '.error')
    print_status "FAIL" "Erreur de traitement: $error_msg"
else
    print_status "WARN" "Endpoint de test non disponible"
fi

echo -e "\n${BLUE}7. Vérification des métriques de performance${NC}"
echo "---------------------------------------------"

# Vérifier les métriques Prometheus
metrics=$(curl -s "http://localhost:9470/metrics" 2>/dev/null || echo "")

if echo "$metrics" | grep -q "adha_ai_kafka_messages_total"; then
    print_status "PASS" "Métriques Kafka collectées"
else
    print_status "WARN" "Métriques Kafka non trouvées"
fi

if echo "$metrics" | grep -q "adha_ai_journal_entries_generated_total"; then
    print_status "PASS" "Métriques d'écritures comptables collectées"
else
    print_status "WARN" "Métriques d'écritures comptables non trouvées"
fi

if echo "$metrics" | grep -q "adha_ai_errors_total"; then
    print_status "PASS" "Métriques d'erreurs collectées"
else
    print_status "WARN" "Métriques d'erreurs non trouvées"
fi

echo -e "\n${BLUE}8. Test de résilience${NC}"
echo "--------------------"

# Test du circuit breaker (simulation)
print_status "INFO" "Test du circuit breaker (simulation)"

# Test de la Dead Letter Queue
if echo "$metrics" | grep -q "dlq"; then
    print_status "PASS" "Configuration DLQ détectée"
else
    print_status "WARN" "Configuration DLQ non détectée"
fi

echo -e "\n${BLUE}9. Vérification des logs${NC}"
echo "-------------------------"

# Vérifier les logs récents pour des erreurs
recent_errors=$(docker logs kiota-adha-ai-service --since=5m 2>&1 | grep -i error | wc -l)

if [ "$recent_errors" -eq 0 ]; then
    print_status "PASS" "Aucune erreur dans les logs récents"
elif [ "$recent_errors" -lt 5 ]; then
    print_status "WARN" "$recent_errors erreurs trouvées dans les logs récents"
else
    print_status "FAIL" "$recent_errors erreurs trouvées dans les logs récents"
fi

echo -e "\n${BLUE}10. Résumé de la validation${NC}"
echo "============================"

total_tests=$((TESTS_PASSED + TESTS_FAILED))
success_rate=$(( (TESTS_PASSED * 100) / total_tests ))

echo -e "Tests exécutés: ${BLUE}$total_tests${NC}"
echo -e "Tests réussis: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests échoués: ${RED}$TESTS_FAILED${NC}"
echo -e "Taux de réussite: ${BLUE}$success_rate%${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Système complètement opérationnel!${NC}"
    echo -e "Le système Adha AI Service est robuste, compatible et prêt pour la production."
    exit 0
elif [ $success_rate -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️ Système partiellement opérationnel${NC}"
    echo -e "Quelques problèmes mineurs détectés, mais le système est fonctionnel."
    exit 1
else
    echo -e "\n${RED}❌ Problèmes critiques détectés${NC}"
    echo -e "Le système nécessite des corrections avant la mise en production."
    exit 2
fi
