import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const successfulRequests = new Rate('successful_requests');
const httpStatus200 = new Counter('http_reqs_status_200');
const httpOtherFailures = new Counter('http_reqs_status_other_failure');

export const options = {

    stages: [
        { duration: '1m', target: 500 },

    ],
    thresholds: {
        'successful_requests': ['rate>0.90'],
        'http_req_duration': ['p(95)<5000'],
        'http_reqs_status_other_failure': ['count<100'],
        'checks': ['rate>0.90'],
    },
};

export default function () {
    const baseUrl = 'https://jsonplaceholder.typicode.com';
    const resAllPosts = http.get(`${baseUrl}/posts`);

    check(resAllPosts, {
        'GET /posts status is 200': (r) => r.status === 200,
        'GET /posts body is not empty': (r) => r.body.length > 0,
    });

    if (resAllPosts.status === 200) {
        httpStatus200.add(1);
        successfulRequests.add(1);
    } else {
        console.error(`Falha em GET /posts! Status: ${resAllPosts.status}, VU: ${__VU}, Iter: ${__ITER}`);
        httpOtherFailures.add(1);
        successfulRequests.add(0);
    }

    sleep(Math.random() * 2 + 0.5);

    const resSinglePost = http.get(`${baseUrl}/posts/1`);

    check(resSinglePost, {
        'GET /posts/1 status is 200': (r) => r.status === 200,
        'GET /posts/1 body contains userId 1': (r) => {
            try {
                return JSON.parse(r.body).userId === 1;
            } catch (e) {
                console.error(`Erro ao fazer parse do JSON para /posts/1: ${e}`);
                return false;
            }
        },
    });

    if (resSinglePost.status === 200) {
        httpStatus200.add(1);
        successfulRequests.add(1);
    } else {
        console.error(`Falha em GET /posts/1! Status: ${resSinglePost.status}, VU: ${__VU}, Iter: ${__ITER}`);
        httpOtherFailures.add(1);
        successfulRequests.add(0);
    }

    sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    "relatorio_carga_k6.html": htmlReport(data),
  };
}