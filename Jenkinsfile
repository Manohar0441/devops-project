pipeline {
    agent any

    environment {
        DOCKER_HUB = "manoharn0441"
        IMAGE_TAG = "latest"
    }

    stages {

        stage('Test Docker') {
         steps {
                sh 'docker version'
             }
        }       
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
                // Using dir() ensures we are in the correct folder so Docker finds the Dockerfile
                dir('frontend') {
                    sh "ls -la"
                    sh "docker build -t ${DOCKER_HUB}/frontend:${IMAGE_TAG} ."
                }
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh """
                    echo "${PASS}" | docker login -u "${USER}" --password-stdin
                    docker push ${DOCKER_HUB}/auth-service:${IMAGE_TAG}
                    docker push ${DOCKER_HUB}/user-service:${IMAGE_TAG}
                    docker push ${DOCKER_HUB}/order-service:${IMAGE_TAG}
                    docker push ${DOCKER_HUB}/frontend:${IMAGE_TAG}
                    """
                }
            }
        }

    stage('Deploy to K8s') {
    agent {
        docker { 
            image 'lachlanevenson/k8s-kubectl:latest'
            args '-u root --network host'
        }
    }
    steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
            sh '''
            echo "Testing cluster..."
            kubectl --kubeconfig=$KUBECONFIG_FILE get nodes

            echo "Deploying..."
            kubectl --kubeconfig=$KUBECONFIG_FILE apply -f .
            '''
        }
    }
}
    }

    post {
        always {
            sh "docker logout"
        }
    }
}