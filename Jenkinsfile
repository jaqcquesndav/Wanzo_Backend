pipeline {
    agent {
        docker {
            image 'node:20.13.0-alpine3.19'
            args '-v /var/jenkins_home/.yarn:/root/.yarn'
        }
    }
    stages {
        stage('Setup') {
            steps {
                sh 'apk add --no-cache git'
                sh 'yarn --version || npm install -g yarn'
            }
        }
        stage('Install') {
            steps {
                sh 'yarn install --frozen-lockfile'
            }
        }
        stage('Lint') {
            steps {
                sh 'yarn lint'
            }
        }
        stage('Test') {
            steps {
                sh 'yarn test'
            }
        }
        stage('Build') {
            steps {
                sh 'yarn build'
            }
        }
        stage('Docker Build') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def services = ['accounting-service', 'admin-service', 'api-gateway', 'customer-service']
                    
                    for (service in services) {
                        dir("apps/${service}") {
                            sh """
                            docker build -t wanzobe/${service}:latest -f Dockerfile .
                            docker push wanzobe/${service}:latest
                            """
                        }
                    }
                }
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}
