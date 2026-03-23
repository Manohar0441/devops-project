pipeline {
    agent any

    environment {
        DOCKER_HUB = "manoharn0441"
        IMAGE_TAG = "latest"
    }

    stages {

        stage('Build Backend') {
            steps {
                sh 'docker build -t $DOCKER_HUB/backend:$IMAGE_TAG ./backend'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'docker build -t $DOCKER_HUB/frontend:$IMAGE_TAG ./frontend'
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                    sh 'docker push $DOCKER_HUB/backend:$IMAGE_TAG'
                    sh 'docker push $DOCKER_HUB/frontend:$IMAGE_TAG'
                }
            }
        }

        stage('Deploy to K8s') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh 'kubectl apply -f k8s/'
                }
            }
        }
    }
}