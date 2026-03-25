pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DOCKER_HUB = "manoharn0441"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        
        stage('Test') {
            steps {
                echo "Webhook working fine! Starting pipeline...."
            }
        }
         
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
            args '-u root --network host --entrypoint=""'
        }
    }
    steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
            sh '''
            echo "Starting kubectl container..."

            sleep 5

            echo "Testing cluster..."
            kubectl --kubeconfig=$KUBECONFIG_FILE get nodes

            echo "Applying manifests..."
            kubectl --kubeconfig=$KUBECONFIG_FILE apply -f k8s/

            echo "Updating all services..."

            kubectl --kubeconfig=$KUBECONFIG_FILE set image deployment/auth-deployment auth=manoharn0441/auth-service:${IMAGE_TAG}

            kubectl --kubeconfig=$KUBECONFIG_FILE set image deployment/user-deployment user=manoharn0441/user-service:${IMAGE_TAG}

            kubectl --kubeconfig=$KUBECONFIG_FILE set image deployment/order-deployment order=manoharn0441/order-service:${IMAGE_TAG}

            kubectl --kubeconfig=$KUBECONFIG_FILE set image deployment/frontend-deployment frontend=manoharn0441/frontend:${IMAGE_TAG}

            echo "Waiting for rollouts..."

            kubectl --kubeconfig=$KUBECONFIG_FILE rollout status deployment/auth-deployment
            kubectl --kubeconfig=$KUBECONFIG_FILE rollout status deployment/user-deployment
            kubectl --kubeconfig=$KUBECONFIG_FILE rollout status deployment/order-deployment
            kubectl --kubeconfig=$KUBECONFIG_FILE rollout status deployment/frontend-deployment
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