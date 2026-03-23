pipeline {
    agent any

    environment {
        DOCKER_HUB = "manoharn0441"
        IMAGE_TAG = "latest"
    }

    stages {

        stage('Build Auth Service') {
            steps {
                sh "docker build -t ${DOCKER_HUB}/auth-service:${IMAGE_TAG} ./auth-service"
            }
        }

        stage('Build User Service') {
            steps {
                sh "docker build -t ${DOCKER_HUB}/user-service:${IMAGE_TAG} ./user-service"
            }
        }

        stage('Build Order Service') {
            steps {
                sh "docker build -t ${DOCKER_HUB}/order-service:${IMAGE_TAG} ./order-service"
            }
        }

        stage('Build Frontend') {
            steps {
                sh "docker build -t ${DOCKER_HUB}/frontend:${IMAGE_TAG} ./frontend"
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh """
                    echo \$PASS | docker login -u \$USER --password-stdin
                    docker push ${DOCKER_HUB}/auth-service:${IMAGE_TAG}
                    docker push ${DOCKER_HUB}/user-service:${IMAGE_TAG}
                    docker push ${DOCKER_HUB}/order-service:${IMAGE_TAG}
                    docker push ${DOCKER_HUB}/frontend:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy to K8s') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh "kubectl apply -f k8s/"
                }
            }
        }
    }
}